import "dotenv/config";
import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";

let twurpleInstance: ApiClient | undefined;

function getTwurpleInstance() {
  twurpleInstance ??= new ApiClient({
    authProvider: new AppTokenAuthProvider(
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!
    ),
  });
  return twurpleInstance;
}

export const twurple = new Proxy({} as ApiClient, {
  get(_target, prop) {
    const instance = getTwurpleInstance();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
