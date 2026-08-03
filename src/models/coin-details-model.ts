// Current price of a single coin in the three currencies shown by More Info.
export class CoinDetailsModel {
    public usd: number;
    public eur: number;
    public ils: number;

    // Creates a three-currency snapshot for the More Info panel.
    public constructor(usd: number, eur: number, ils: number) {
        this.usd = usd;
        this.eur = eur;
        this.ils = ils;
    }
}
