class AssetNotFound extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssetNotFound';
    }
}

class LibraryEmpty extends Error {
    constructor(message) {
        super(message);
        this.name = 'LibraryEmpty';
    }
}

class InvalidLayout extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidLayout';
    }
}

class TimelineOverflow extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimelineOverflow';
    }
}

class FFmpegUnavailable extends Error {
    constructor(message) {
        super(message);
        this.name = 'FFmpegUnavailable';
    }
}

class DatabaseLocked extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseLocked';
    }
}

module.exports = {
    AssetNotFound,
    LibraryEmpty,
    InvalidLayout,
    TimelineOverflow,
    FFmpegUnavailable,
    DatabaseLocked
};
