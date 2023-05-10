// repositoryAndTag.js
export class RepositoryAndTag {
    constructor(repositoryAndTag) {
        if (!repositoryAndTag) {
            throw new Error("Invalid image, empty repository and tag");
        }
        const separatorIdx = repositoryAndTag.indexOf(':');
        if (separatorIdx === -1) {
            this.repository = repositoryAndTag;
        } else {
            this.repository = repositoryAndTag.slice(0, separatorIdx);
            this.tag = repositoryAndTag.slice(separatorIdx + 1);
        }
        if (!this.repository) {
            throw new Error("Repository must be provided");
        }
    }

    toString() {
        return this.tag === undefined ? this.repository : `${this.repository}:${this.tag}`;
    }
}

