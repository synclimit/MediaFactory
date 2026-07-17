const RenderPlan = require('./RenderPlan');
class RenderPlanner {
    createPlan(editorState) {
        return new RenderPlan(editorState);
    }
}
module.exports = RenderPlanner;