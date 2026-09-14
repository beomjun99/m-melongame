import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  Bodies,
  Composite,
  Engine,
  Render,
  Runner,
  type IChamferableBodyDefinition
} from 'matter-js';
import { BOARD_CONFIG, DROP_CONFIG, PHYSICS_CONFIG } from '../game/config';
import { registerMergeCollisionHandler } from '../game/collision';
import { registerGameOverWatcher } from '../game/gameOver';
import { clampDropX, createObjectBody } from '../game/spawn';
import type { GameState, MergeResult, ObjectLevelConfig } from '../game/types';

type GameBoardProps = {
  width: number;
  height: number;
  gameState: GameState;
  currentObject: ObjectLevelConfig;
  onGameOver: () => void;
  onMerge: (result: MergeResult) => void;
  onObjectDropped: (object: ObjectLevelConfig) => void;
};

export function GameBoard({
  width,
  height,
  gameState,
  currentObject,
  onGameOver,
  onMerge,
  onObjectDropped
}: GameBoardProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const renderRef = useRef<Render | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const cleanupCollisionRef = useRef<(() => void) | null>(null);
  const cleanupGameOverRef = useRef<(() => void) | null>(null);
  const gameStateRef = useRef(gameState);
  const onGameOverRef = useRef(onGameOver);
  const onMergeRef = useRef(onMerge);
  const onObjectDroppedRef = useRef(onObjectDropped);
  const [dropX, setDropX] = useState(() => width / 2);
  const [canDrop, setCanDrop] = useState(true);

  useEffect(() => {
    gameStateRef.current = gameState;

    if ((gameState === 'GAME_OVER' || gameState === 'PAUSED') && runnerRef.current) {
      Runner.stop(runnerRef.current);
      return;
    }

    if (gameState === 'PLAYING' && runnerRef.current && engineRef.current) {
      Runner.run(runnerRef.current, engineRef.current);
    }
  }, [gameState]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    onMergeRef.current = onMerge;
  }, [onMerge]);

  useEffect(() => {
    onObjectDroppedRef.current = onObjectDropped;
  }, [onObjectDropped]);

  useEffect(() => {
    setDropX((currentDropX) => clampDropX(currentDropX, currentObject.radius, width));
  }, [currentObject.radius, width]);

  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    const engine = Engine.create();
    engine.gravity.y = PHYSICS_CONFIG.gravityY;
    engineRef.current = engine;
    cleanupCollisionRef.current = registerMergeCollisionHandler({
      engine,
      onMerge: (result) => onMergeRef.current(result)
    });
    cleanupGameOverRef.current = registerGameOverWatcher({
      engine,
      onGameOver: () => {
        if (gameStateRef.current === 'GAME_OVER') {
          return;
        }

        if (runnerRef.current) {
          Runner.stop(runnerRef.current);
        }

        onGameOverRef.current();
      }
    });

    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: BOARD_CONFIG.backgroundColor,
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    const wallOptions: IChamferableBodyDefinition = {
      isStatic: true,
      render: {
        fillStyle: BOARD_CONFIG.wallColor
      }
    };

    const floor = Bodies.rectangle(
      width / 2,
      height + BOARD_CONFIG.wallThickness / 2,
      width,
      BOARD_CONFIG.wallThickness,
      wallOptions
    );
    const leftWall = Bodies.rectangle(
      -BOARD_CONFIG.wallThickness / 2,
      height / 2,
      BOARD_CONFIG.wallThickness,
      height * 2,
      wallOptions
    );
    const rightWall = Bodies.rectangle(
      width + BOARD_CONFIG.wallThickness / 2,
      height / 2,
      BOARD_CONFIG.wallThickness,
      height * 2,
      wallOptions
    );

    Composite.add(engine.world, [floor, leftWall, rightWall]);

    const runner = Runner.create();
    runnerRef.current = runner;

    Render.run(render);
    Runner.run(runner, engine);

    return () => {
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (renderRef.current) {
        Render.stop(renderRef.current);
        renderRef.current.canvas.remove();
        renderRef.current.textures = {};
      }
      if (cleanupCollisionRef.current) {
        cleanupCollisionRef.current();
      }
      if (cleanupGameOverRef.current) {
        cleanupGameOverRef.current();
      }
      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current);
      }
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      cooldownTimerRef.current = null;
      cleanupCollisionRef.current = null;
      cleanupGameOverRef.current = null;
    };
  }, [height, width]);

  const updateDropPosition = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    setDropX(clampDropX(localX, currentObject.radius, width));
  };

  const dropObject = () => {
    const engine = engineRef.current;

    if (!engine || !canDrop || gameStateRef.current !== 'PLAYING') {
      return;
    }

    const body = createObjectBody(currentObject, dropX, DROP_CONFIG.spawnY);
    Composite.add(engine.world, body);
    onObjectDroppedRef.current(currentObject);
    setCanDrop(false);

    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = window.setTimeout(() => {
      setCanDrop(true);
      cooldownTimerRef.current = null;
    }, DROP_CONFIG.cooldownMs);
  };

  return (
    <section className="board-section" aria-label="Game board">
      <div
        className="game-board"
        ref={sceneRef}
        style={{ width, height }}
        onPointerMove={updateDropPosition}
        onPointerDown={dropObject}
      >
        <div className="game-over-line" style={{ top: BOARD_CONFIG.gameOverLineY }} aria-hidden="true" />
        <div
          className={`drop-preview ${canDrop && gameState === 'PLAYING' ? '' : 'drop-preview-disabled'}`}
          style={{
            left: dropX,
            top: DROP_CONFIG.previewY,
            width: currentObject.radius * 2,
            height: currentObject.radius * 2,
            backgroundColor: currentObject.color
          }}
          aria-hidden="true"
        >
          {currentObject.level}
        </div>
      </div>
    </section>
  );
}
