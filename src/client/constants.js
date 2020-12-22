/**
 * All standard DOM events
 */
export const domEvents = [
  "animationend",
  "animationiteration",
  "animationstart",
  "beginEvent",
  "endEvent",
  "repeatEvent",
  "chargingchange",
  "chargingtimechange",
  "dischargingtimechange",
  "levelchange",
  "alerting",
  "busy",
  "callschanged",
  "cfstatechange",
  "connected",
  "connecting",
  "dialing",
  "disconnected",
  "disconnecting",
  "error",
  "held",
  "holding",
  "incoming",
  "resuming",
  "statechange",
  "voicechange",
  "transitionend",
  "abort",
  "blocked",
  "complete",
  "error",
  "success",
  "upgradeneeded",
  "versionchange",
  "unload",
  "DOMAttrModified",
  "DOMCharacterDataModified",
  "DOMContentLoaded",
  "DOMElementNameChanged",
  "DOMNodeInserted",
  "DOMNodeInsertedIntoDocument",
  "DOMNodeRemoved",
  "DOMNodeRemovedFromDocument",
  "DOMSubtreeModified",
  "drag",
  "dragend",
  "dragenter",
  "dragleave",
  "dragover",
  "dragstart",
  "drop",
  "invalid",
  "overflow",
  "underflow",
  "command",
  "commandupdate",
  "blur",
  "change",
  "focus",
  "focusin",
  "focusout",
  "reset",
  "submit",
  "mozbrowserclose",
  "mozbrowsercontextmenu",
  "mozbrowsererror",
  "mozbrowsericonchange",
  "mozbrowserlocationchange",
  "mozbrowserloadend",
  "mozbrowserloadstart",
  "mozbrowseropenwindow",
  "mozbrowsersecuritychange",
  "mozbrowsershowmodalprompt",
  "mozbrowsertitlechange",
  "click",
  "contextmenu",
  "DOMMouseScroll",
  "dblclick",
  "gamepadconnected",
  "gamepaddisconnected",
  "keydown",
  "keypress",
  "keyup",
  "MozGamepadButtonDown",
  "MozGamepadButtonUp",
  "mousedown",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "mousewheel",
  "MozMousePixelScroll",
  "pointerlockchange",
  "pointerlockerror",
  "wheel",
  "audioprocess",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "ended",
  "ended",
  "loadeddata",
  "loadedmetadata",
  "MozAudioAvailable",
  "pause",
  "play",
  "playing",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
  "complete",
  "DOMMenuItemActive",
  "DOMMenuItemInactive",
  "datachange",
  "dataerror",
  "disabled",
  "enabled",
  "offline",
  "online",
  "statuschange",
  "connectionInfoUpdate",
  "popuphidden",
  "popuphiding",
  "popupshowing",
  "popupshown",
  "afterprint",
  "beforeprint",
  "abort",
  "error",
  "load",
  "loadend",
  "loadstart",
  "progress",
  "progress",
  "timeout",
  "abort",
  "cached",
  "error",
  "load",
  "afterscriptexecute",
  "beforescriptexecute",
  "compassneedscalibration",
  "devicelight",
  "devicemotion",
  "deviceorientation",
  "deviceproximity",
  "MozOrientation",
  "orientationchange",
  "userproximity",
  "pagehide",
  "pageshow",
  "popstate",
  "icccardlockerror",
  "iccinfochange",
  "smartcard-insert",
  "smartcard-remove",
  "stkcommand",
  "stksessionend",
  "cardstatechange",
  "delivered",
  "received",
  "sent",
  "ussdreceived",
  "change",
  "storage",
  "SVGAbort",
  "SVGError",
  "SVGLoad",
  "SVGResize",
  "SVGScroll",
  "SVGUnload",
  "SVGZoom",
  "visibilitychange",
  "compositionend",
  "compositionstart",
  "compositionupdate",
  "copy",
  "cut",
  "paste",
  "select",
  "touchcancel",
  "touchend",
  "touchenter",
  "touchleave",
  "touchmove",
  "touchstart",
  "checking",
  "downloading",
  "error",
  "noupdate",
  "obsolete",
  "updateready",
  "broadcast",
  "CheckboxStateChange",
  "hashchange",
  "input",
  "RadioStateChange",
  "readystatechange",
  "ValueChange",
  "fullscreenchange",
  "fullscreenerror",
  "MozScrolledAreaChanged",
  "resize",
  "scroll",
  "close",
  "error",
  "message",
  "open",
  "beforeunload",
  "localized",
  "message",
  "message",
  "message",
  "moztimechange",
  "open",
  "show"
].concat([
  // Pointer Events
  // https://developer.mozilla.org/en-US/docs/Web/Events#Pointer_events
  "pointerover",
  "pointerenter",
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "pointerout",
  "pointerleave",
  "gotpointercapture",
  "lostpointercapture"
]).uniq();

/**
 * All standard CSS Properties
 * https://www.w3.org/Style/CSS/all-properties.en.html
 */
export const cssProperties =  [
  'align-content',
  'align-items',
  'align-self',
  'alignment-baseline',
  'all',
  'animation',
  'animation-delay',
  'animation-direction',
  'animation-duration',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-name',
  'animation-play-state',
  'animation-timing-function',
  'appearance',
  'aspect-ratio',
  'azimuth',
  'backface-visibility',
  'background',
  'background-attachment',
  'background-blend-mode',
  'background-clip',
  'background-color',
  'background-image',
  'background-origin',
  'background-position',
  'background-repeat',
  'background-size',
  'baseline-shift',
  'baseline-source',
  'block-ellipsis',
  'block-size',
  'block-step',
  'block-step-align',
  'block-step-insert',
  'block-step-round',
  'block-step-size',
  'bookmark-label',
  'bookmark-level',
  'bookmark-state',
  'border',
  'border-block',
  'border-block-color',
  'border-block-end',
  'border-block-end-color',
  'border-block-end-style',
  'border-block-end-width',
  'border-block-start',
  'border-block-start-color',
  'border-block-start-style',
  'border-block-start-width',
  'border-block-style',
  'border-block-width',
  'border-bottom',
  'border-bottom-color',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-bottom-style',
  'border-bottom-width',
  'border-boundary',
  'border-collapse',
  'border-color',
  'border-end-end-radius',
  'border-end-start-radius',
  'border-image',
  'border-image-outset',
  'border-image-repeat',
  'border-image-slice',
  'border-image-source',
  'border-image-width',
  'border-inline',
  'border-inline-color',
  'border-inline-end',
  'border-inline-end-color',
  'border-inline-end-style',
  'border-inline-end-width',
  'border-inline-start',
  'border-inline-start-color',
  'border-inline-start-style',
  'border-inline-start-width',
  'border-inline-style',
  'border-inline-width',
  'border-left',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-radius',
  'border-right',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-spacing',
  'border-start-end-radius',
  'border-start-start-radius',
  'border-style',
  'border-top',
  'border-top-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-top-style',
  'border-top-width',
  'border-width',
  'bottom',
  'box-decoration-break',
  'box-shadow',
  'box-sizing',
  'box-snap',
  'break-after',
  'break-before',
  'break-inside',
  'caption-side',
  'caret',
  'caret-color',
  'caret-shape',
  'chains',
  'clear',
  'clip',
  'clip-path',
  'clip-rule',
  'color',
  'color-adjust',
  'color-interpolation-filters',
  'color-scheme',
  'column-count',
  'column-fill',
  'column-gap',
  'column-rule',
  'column-rule-color',
  'column-rule-style',
  'column-rule-width',
  'column-span',
  'column-width',
  'columns',
  'contain',
  'contain-intrinsic-size',
  'content',
  'content-visibility',
  'continue',
  'counter-increment',
  'counter-reset',
  'counter-set',
  'cue',
  'cue-after',
  'cue-before',
  'cursor',
  'direction',
  'display',
  'dominant-baseline',
  'elevation',
  'empty-cells',
  'fill',
  'fill-break',
  'fill-color',
  'fill-image',
  'fill-opacity',
  'fill-origin',
  'fill-position',
  'fill-repeat',
  'fill-rule',
  'fill-size',
  'filter',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'float',
  'float-defer',
  'float-offset',
  'float-reference',
  'flood-color',
  'flood-opacity',
  'flow',
  'flow-from',
  'flow-into',
  'font',
  'font-family',
  'font-feature-settings',
  'font-kerning',
  'font-language-override',
  'font-optical-sizing',
  'font-palette',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-synthesis',
  'font-synthesis-small-caps',
  'font-synthesis-style',
  'font-synthesis-weight',
  'font-variant',
  'font-variant-alternates',
  'font-variant-caps',
  'font-variant-east-asian',
  'font-variant-emoji',
  'font-variant-ligatures',
  'font-variant-numeric',
  'font-variant-position',
  'font-variation-settings',
  'font-weight',
  'footnote-display',
  'footnote-policy',
  'forced-color-adjust',
  'gap',
  'glyph-orientation-vertical',
  'grid',
  'grid-area',
  'grid-auto-columns',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-row',
  'grid-row-end',
  'grid-row-start',
  'grid-template',
  'grid-template-areas',
  'grid-template-columns',
  'grid-template-rows',
  'hanging-punctuation',
  'height',
  'hyphenate-character',
  'hyphenate-limit-chars',
  'hyphenate-limit-last',
  'hyphenate-limit-lines',
  'hyphenate-limit-zone',
  'hyphens',
  'image-orientation',
  'image-rendering',
  'image-resolution',
  'initial-letter',
  'initial-letter-align',
  'initial-letter-wrap',
  'inline-size',
  'inline-sizing',
  'inset',
  'inset-block',
  'inset-block-end',
  'inset-block-start',
  'inset-inline',
  'inset-inline-end',
  'inset-inline-start',
  'isolation',
  'justify-content',
  'justify-items',
  'justify-self',
  'leading-trim',
  'left',
  'letter-spacing',
  'lighting-color',
  'line-break',
  'line-clamp',
  'line-grid',
  'line-height',
  'line-height-step',
  'line-padding',
  'line-snap',
  'list-style',
  'list-style-image',
  'list-style-position',
  'list-style-type',
  'margin',
  'margin-block',
  'margin-block-end',
  'margin-block-start',
  'margin-bottom',
  'margin-break',
  'margin-inline',
  'margin-inline-end',
  'margin-inline-start',
  'margin-left',
  'margin-right',
  'margin-top',
  'margin-trim',
  'marker',
  'marker-end',
  'marker-knockout-left',
  'marker-knockout-right',
  'marker-mid',
  'marker-pattern',
  'marker-segment',
  'marker-side',
  'marker-start',
  'mask',
  'mask-border',
  'mask-border-mode',
  'mask-border-outset',
  'mask-border-repeat',
  'mask-border-slice',
  'mask-border-source',
  'mask-border-width',
  'mask-clip',
  'mask-composite',
  'mask-image',
  'mask-mode',
  'mask-origin',
  'mask-position',
  'mask-repeat',
  'mask-size',
  'mask-type',
  'max-block-size',
  'max-height',
  'max-inline-size',
  'max-lines',
  'max-width',
  'min-block-size',
  'min-height',
  'min-inline-size',
  'min-width',
  'mix-blend-mode',
  'nav-down',
  'nav-left',
  'nav-right',
  'nav-up',
  'object-fit',
  'object-position',
  'offset',
  'offset-anchor',
  'offset-distance',
  'offset-path',
  'offset-position',
  'offset-rotate',
  'opacity',
  'order',
  'orphans',
  'outline',
  'outline-color',
  'outline-offset',
  'outline-style',
  'outline-width',
  'overflow',
  'overflow-anchor',
  'overflow-block',
  'overflow-clip-margin',
  'overflow-inline',
  'overflow-wrap',
  'overflow-x',
  'overflow-y',
  'overscroll-behavior',
  'overscroll-behavior-block',
  'overscroll-behavior-inline',
  'overscroll-behavior-x',
  'overscroll-behavior-y',
  'padding',
  'padding-block',
  'padding-block-end',
  'padding-block-start',
  'padding-bottom',
  'padding-inline',
  'padding-inline-end',
  'padding-inline-start',
  'padding-left',
  'padding-right',
  'padding-top',
  'page',
  'page-break-after',
  'page-break-before',
  'page-break-inside',
  'pause',
  'pause-after',
  'pause-before',
  'perspective',
  'perspective-origin',
  'pitch',
  'pitch-range',
  'place-content',
  'place-items',
  'place-self',
  'play-during',
  'position',
  'quotes',
  'region-fragment',
  'resize',
  'rest',
  'rest-after',
  'rest-before',
  'richness',
  'right',
  'rotate',
  'row-gap',
  'ruby-align',
  'ruby-merge',
  'ruby-overhang',
  'ruby-position',
  'running',
  'scale',
  'scroll-behavior',
  'scroll-margin',
  'scroll-margin-block',
  'scroll-margin-block-end',
  'scroll-margin-block-start',
  'scroll-margin-bottom',
  'scroll-margin-inline',
  'scroll-margin-inline-end',
  'scroll-margin-inline-start',
  'scroll-margin-left',
  'scroll-margin-right',
  'scroll-margin-top',
  'scroll-padding',
  'scroll-padding-block',
  'scroll-padding-block-end',
  'scroll-padding-block-start',
  'scroll-padding-bottom',
  'scroll-padding-inline',
  'scroll-padding-inline-end',
  'scroll-padding-inline-start',
  'scroll-padding-left',
  'scroll-padding-right',
  'scroll-padding-top',
  'scroll-snap-align',
  'scroll-snap-stop',
  'scroll-snap-type',
  'scrollbar-color',
  'scrollbar-gutter',
  'scrollbar-width',
  'shape-image-threshold',
  'shape-inside',
  'shape-margin',
  'shape-outside',
  'spatial-navigation-action',
  'spatial-navigation-contain',
  'spatial-navigation-function',
  'speak',
  'speak-as',
  'speak-header',
  'speak-numeral',
  'speak-punctuation',
  'speech-rate',
  'stress',
  'string-set',
  'stroke',
  'stroke-align',
  'stroke-alignment',
  'stroke-break',
  'stroke-color',
  'stroke-dash-corner',
  'stroke-dash-justify',
  'stroke-dashadjust',
  'stroke-dasharray',
  'stroke-dashcorner',
  'stroke-dashoffset',
  'stroke-image',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-origin',
  'stroke-position',
  'stroke-repeat',
  'stroke-size',
  'stroke-width',
  'tab-size',
  'table-layout',
  'text-align',
  'text-align-all',
  'text-align-last',
  'text-combine-upright',
  'text-decoration',
  'text-decoration-color',
  'text-decoration-line',
  'text-decoration-skip',
  'text-decoration-skip-box',
  'text-decoration-skip-ink',
  'text-decoration-skip-inset',
  'text-decoration-skip-self',
  'text-decoration-skip-spaces',
  'text-decoration-style',
  'text-decoration-thickness',
  'text-edge',
  'text-emphasis',
  'text-emphasis-color',
  'text-emphasis-position',
  'text-emphasis-skip',
  'text-emphasis-style',
  'text-group-align',
  'text-indent',
  'text-justify',
  'text-orientation',
  'text-overflow',
  'text-shadow',
  'text-space-collapse',
  'text-space-trim',
  'text-spacing',
  'text-transform',
  'text-underline-offset',
  'text-underline-position',
  'text-wrap',
  'top',
  'transform',
  'transform-box',
  'transform-origin',
  'transform-style',
  'transition',
  'transition-delay',
  'transition-duration',
  'transition-property',
  'transition-timing-function',
  'translate',
  'unicode-bidi',
  'user-select',
  'vertical-align',
  'visibility',
  'voice-balance',
  'voice-duration',
  'voice-family',
  'voice-pitch',
  'voice-range',
  'voice-rate',
  'voice-stress',
  'voice-volume',
  'volume',
  'white-space',
  'widows',
  'width',
  'will-change',
  'word-boundary-detection',
  'word-boundary-expansion',
  'word-break',
  'word-spacing',
  'word-wrap',
  'wrap-after',
  'wrap-before',
  'wrap-flow',
  'wrap-inside',
  'wrap-through',
  'writing-mode',
  'z-index',
];
