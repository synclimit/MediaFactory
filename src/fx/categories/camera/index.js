import { fxRegistry } from "../../registry/FXRegistry";

import * as CAM01_CameraShake from "./CAM01_CameraShake";
import * as CAM02_BeatZoom from "./CAM02_BeatZoom";

export function registerCameraFX() {
    fxRegistry.register(CAM01_CameraShake);
    fxRegistry.register(CAM02_BeatZoom);
}
