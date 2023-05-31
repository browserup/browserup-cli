import ora from "ora";

// Abstraction over spinner implementation
export class LogSpinner {
  static spinner = undefined

  static logWithSpinner(status) {
    this.spinner = this.#getSpinner().start();
  }

  static isSpinnerActive() {
    return this.#getSpinner().isSpinning;
  }

  static updateLogSpinner(status) {
    this.#getSpinner().text = status
  }

  static stopLogSpinner() {
    this.#getSpinner().stop()
  }

  static #getSpinner() {
    if (this.spinner === undefined) {
      this.spinner = ora({
        text: "",
        spinner: "dots",
        discardStdin: false
      })
    }
    return this.spinner;
  }
}
