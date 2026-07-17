class FavoriteManager {
    toggleFavorite(project) {
        project.isFavorite = !project.isFavorite;
        return project.isFavorite;
    }
}
module.exports = FavoriteManager;