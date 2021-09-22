export function handle(state, action) {
    if (state.counter === undefined) {
      state.counter = 0;
    }
    if (action.input.function === "add") {
      state.counter+=+action.input.payload;
      return {state};
    }
    if (action.input.function === "subtract") {
        state.counter--;
        return {state};
      }
    if (action.input.function === "value") {
      return {result: state.counter}
    }
    if (action.input.function === "blockHeight") {
      state.blockHeight = SmartWeave.block.height;
      return {state};
    }
  }