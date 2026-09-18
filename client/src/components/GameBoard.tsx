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
import { getFruitSkin } from '../theme/config';
import { preloadThemeImages } from '../theme/imageCache';
import type { GameTheme } from '../theme/types';
import { MobileControls } from '../controls/MobileControls';
import { moveDropX, type MoveDirection } from '../controls/movement';
import { CONTROL_CONFIG } from '../controls/config';
import { DropGuide } from '../game/DropGuide';
import type { ControlSettings } from '../settings/useControlSettings';

type AttackFruitRequest = {
  id: number;
  object: ObjectLevelConfig;
};

type GameBoardProps = {
  controlSettings: ControlSettings;
  width: number;
  height: number;
  gameState: GameState;
  currentObject: ObjectLevelConfig;
  attackFruit: AttackFruitRequest | null;
  theme: GameTheme;
  onGameOver: () => void;
  onMerge: (result: MergeResult) => void;
  onObjectDropped: (object: ObjectLevelConfig) => void;
};

export function GameBoard({
  controlSettings,
  width,
  height,
  gameState,
  currentObject,
  attackFruit,
  theme,
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
  const processedAttackIdRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  const onGameOverRef = useRef(onGameOver);
  const onMergeRef = useRef(onMerge);
  const onObjectDroppedRef = useRef(onObjectDropped);
  const themeRef = useRef(theme);
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
    themeRef.current = theme;
    void preloadThemeImages(theme.fruits.map((skin) => skin.imageUrl).filter((imageUrl): imageUrl is string => Boolean(imageUrl)));
  }, [theme]);

  useEffect(() => {
    setDropX((currentDropX) => clampDropX(currentDropX, currentObject.radius, width));
  }, [currentObject.radius, width]);

  useEffect(() => {
    const engine = engineRef.current;

    if (!engine || !attackFruit || processedAttackIdRef.current === attackFruit.id || gameStateRef.current !== 'PLAYING') {
      return;
    }

    processedAttackIdRef.current = attackFruit.id;

    const x = clampDropX(
      attackFruit.object.radius + Math.random() * (width - attackFruit.object.radius * 2),
      attackFruit.object.radius,
      width
    );
    const body = createObjectBody(
      attackFruit.object,
      x,
      DROP_CONFIG.spawnY,
      getFruitSkin(themeRef.current, attackFruit.object.level),
      'ATTACK'
    );

    Composite.add(engine.world, body);
  }, [attackFruit, width]);

  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    const engine = Engine.create();
    engine.gravity.y = PHYSICS_CONFIG.gravityY;
    engineRef.current = engine;
    cleanupCollisionRef.current = registerMergeCollisionHandler({
      engine,
      theme: themeRef.current,
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

  const getPointerX = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - bounds.left) * width / bounds.width;
    return clampDropX(localX, currentObject.radius, width);
  };

  const updateDropPosition = (event: PointerEvent<HTMLDivElement>) => {
    if (!allowsBoardPointer(event) || gameState !== 'PLAYING' || !event.isPrimary) {
      return;
    }
    setDropX(getPointerX(event));
  };

  const dropObject = (x: number) => {
    const engine = engineRef.current;

    if (!engine || !canDrop || cooldownTimerRef.current !== null || gameStateRef.current !== 'PLAYING') {
      return;
    }

    const body = createObjectBody(currentObject, x, DROP_CONFIG.spawnY, getFruitSkin(themeRef.current, currentObject.level));
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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!allowsBoardPointer(event) || !event.isPrimary || event.button !== 0 || gameState !== 'PLAYING') {
      return;
    }
    const x = getPointerX(event);
    setDropX(x);
    dropObject(x);
  };

  // Touch/pen use the dedicated controls. Narrow screens use them even with a mouse.
  const allowsBoardPointer = (event: PointerEvent<HTMLDivElement>) =>
    event.pointerType === 'mouse' && !window.matchMedia('(max-width: 540px)').matches;

  const moveDropPosition = (direction: MoveDirection) => {
    if (gameState !== 'PLAYING' || gameStateRef.current !== 'PLAYING') {
      return false;
    }
    const nextX = moveDropX({
      x: dropX, direction, radius: currentObject.radius, boardWidth: width,
      step: CONTROL_CONFIG.moveStep, wrapMovementEnabled: controlSettings.wrapMovementEnabled
    });
    setDropX(nextX);
    return nextX > currentObject.radius && nextX < width - currentObject.radius;
  };

  const currentSkin = getFruitSkin(theme, currentObject.level);

  return (
    <section className="board-section" aria-label="Game board">
      <div
        className="game-board"
        ref={sceneRef}
        style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
        onPointerMove={updateDropPosition}
        onPointerDown={handlePointerDown}
      >
        <div className="game-over-line" style={{ top: `${BOARD_CONFIG.gameOverLineY / height * 100}%` }} aria-hidden="true" />
        <DropGuide engineRef={engineRef} x={dropX} radius={currentObject.radius} width={width} height={height}
          skin={currentSkin} visible={canDrop && gameState === 'PLAYING'} />
        <div
          className={`drop-preview ${canDrop && gameState === 'PLAYING' ? '' : 'drop-preview-disabled'}`}
          style={{
            left: `${dropX / width * 100}%`,
            top: `${DROP_CONFIG.previewY / height * 100}%`,
            width: `${currentObject.radius * 2 / width * 100}%`,
            height: `${currentObject.radius * 2 / height * 100}%`,
            backgroundColor: currentSkin.color,
          }}
          aria-hidden="true"
        >
          {currentSkin.imageUrl
            ? <img key={currentSkin.imageUrl} src={currentSkin.imageUrl} alt="" draggable={false} />
            : currentObject.level}
        </div>
      </div>
      <MobileControls
        settings={controlSettings}
        disabled={gameState !== 'PLAYING'}
        dropDisabled={!canDrop}
        onMove={moveDropPosition}
        onDrop={() => dropObject(clampDropX(dropX, currentObject.radius, width))}
      />
    </section>
  );
}
