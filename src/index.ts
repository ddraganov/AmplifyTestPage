import Navigo from "navigo";
import { NuveiPage } from "./pages/nuvei/index";

const router = new Navigo("/", { hash: true });

router
  .on({
    "/": () => NuveiPage(),
    "/nuvei": () => NuveiPage(),
  })
  .resolve();
