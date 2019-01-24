var NodeState = module.exports.NodeState = {

    NONE: 1,
    INITIALIZED: 2,
    STARTING: 4,
    EMITTING: 8,
    PAUSED: 16,
    CLOSED: 32,
    ERRORED: 64,
    READY: 128
};