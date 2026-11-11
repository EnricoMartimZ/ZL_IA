// API pública do Core. Tudo que o editor, a CLI e o Renderer usam do Core sai daqui.
// O Core roda no Node e no navegador: nada de node:*, DOM, relógio ou sorteio.
export { validateProject } from './validation/index.js';
export { schema } from './validation/schema.js';
export { MIN_FONT_SIZE, brandTokenDefined } from './validation/semantic.js';
export { getTimeline, scenesAtFrame } from './timeline/index.js';
export { resolveEasing, cubicBezier, lerp, EASING_NAMES, NAMED_EASINGS } from './interpolation/index.js';
export { trackValue, ANIMATABLE } from './keyframes/index.js';
export { listPresets, listTransitions, animationModifiers, animationProgress, transitionContainers, transitionProgress, DIRECTIONS, PRESET_DEFAULTS } from './presets/index.js';
export { evaluateFrame, evaluateLayer, resolveColor, resolveFont } from './evaluate/index.js';
export { applyCommands, mergePatch, COMMAND_TYPES } from './commands/index.js';
export { createProject, migrateProject, listTemplates, SCHEMA_VERSION, NEUTRAL_BRAND } from './project/index.js';
