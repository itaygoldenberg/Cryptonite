// Current price of a single coin in the three currencies shown by More Info.
export class CoinDetailsModel {
    public usd: number;
    public eur: number;
    public ils: number;

    public constructor(usd: number, eur: number, ils: number) {
        this.usd = usd;
        this.eur = eur;
        this.ils = ils;
    }
}
