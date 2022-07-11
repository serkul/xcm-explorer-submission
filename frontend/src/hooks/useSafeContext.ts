import { Context, useContext } from "react";

export function useSafeContext<T>(context: Context<T>, errorMessage = "Missing required context") {
  const result = useContext(context);
  if (result === undefined) {
    throw new Error(errorMessage);
  }
  return result as Exclude<T, undefined>;
}
