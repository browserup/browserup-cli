import { decoratedError } from "../browserup_errors.mjs";

export class RepositoryAndTag {
    constructor(repositoryAndTag) {
        if (!repositoryAndTag) {
            throw decoratedError("Invalid image, empty repository and tag");
        }
        const separatorIdx = repositoryAndTag.indexOf(":");
        if (separatorIdx === -1) {
            this.repository = repositoryAndTag;
        } else {
            this.repository = repositoryAndTag.slice(0, separatorIdx);
            this.tag = repositoryAndTag.slice(separatorIdx + 1);
        }
        if (!this.repository) {
            throw decoratedError("Repository must be provided");
        }
    }

    toString() {
        return this.tag === undefined ? this.repository : `${this.repository}:${this.tag}`;
    }
}

