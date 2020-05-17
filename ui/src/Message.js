export class Message {

    constructor(origin, interaction, index = 0, created = Math.floor(new Date().getTime() / 1000)) {
        this.origin = origin;
        this.interaction = interaction;
        this.index = index;
        this.created = created;
    }

}