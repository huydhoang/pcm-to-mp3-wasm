/**
 * pcm-to-mp3-wasm - TypeScript type definitions
 */
// Worker message types
export var MessageType;
(function (MessageType) {
    MessageType["LOAD"] = "LOAD";
    MessageType["CONVERT"] = "CONVERT";
    MessageType["TERMINATE"] = "TERMINATE";
    MessageType["PROGRESS"] = "PROGRESS";
    MessageType["LOG"] = "LOG";
    MessageType["ERROR"] = "ERROR";
    MessageType["RESULT"] = "RESULT";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=types.js.map