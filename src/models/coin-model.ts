// Basic coin data shown on the home page cards.
export class CoinModel {
    public id: string;
    public symbol: string;
    public name: string;
    public image: string;

    public constructor(id: string, symbol: string, name: string, image: string) {
        this.id = id;
        this.symbol = symbol;
        this.name = name;
        this.image = image;
    }
}
