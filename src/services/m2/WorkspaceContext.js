class WorkspaceContextService {
  constructor() {
    this._workspaceId = 'default';
    this._subscribers = new Set();
  }

  getWorkspaceId() {
    return this._workspaceId;
  }

  setWorkspaceId(id) {
    if (this._workspaceId !== id) {
      this._workspaceId = id;
      this._notify();
    }
  }

  subscribe(callback) {
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._subscribers.delete(callback);
  }

  _notify() {
    this._subscribers.forEach(cb => {
      try {
        cb(this._workspaceId);
      } catch (err) {
        console.error('WorkspaceContext subscriber error:', err);
      }
    });
  }
}

export const m2WorkspaceContext = new WorkspaceContextService();
