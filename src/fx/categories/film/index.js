import { fxRegistry } from "../../registry/FXRegistry";

import * as FLM01_FilmGrain from "./FLM01_FilmGrain";
import * as FLM02_Vignette from "./FLM02_Vignette";

export function registerFilmFX() {
    fxRegistry.register(FLM01_FilmGrain);
    fxRegistry.register(FLM02_Vignette);
}
