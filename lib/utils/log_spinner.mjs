import ora from "ora";

// Abstraction over spinner implementation
export class LogSpinner {
  static spinner = undefined

  static start(status) {
    const spinner = this.#getSpinner()
    spinner.text = status
    spinner.start()
  }

  static update(status) {
    this.#getSpinner().text = status
  }

  static stop() {
    this.#getSpinner().stop()
  }

  static isRunning() {
    return this.#getSpinner().isSpinning
  }

  static runWithInterruptedSpinner(callback) {
    const sp = this.#getSpinner()
    const spinnerText = sp.text
    sp.stop()
    callback()
    sp.start(spinnerText)
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
