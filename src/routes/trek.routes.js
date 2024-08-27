import { Router } from "express";
import {
  addNewDateForTrek,
  addTrek,
  aggregateTrekAllDetails,
  aggregateTrekAllDetailsForSliderHome,
  aggregateTrekAllDetailsForSliderHomeSortByDateInAsc,
  aggregateTrekAllDetailsForSliderHomeSortByDateInDesc,
  aggregateTrekAllDetailsForSliderHomeSortByPriceInAsc,
  aggregateTrekAllDetailsForSliderHomeSortByPriceInDesc,
  aggregateTrekDifficultDifficultyForSliderHome,
  aggregateTrekEasyDifficultyForSliderHome,
  aggregateTrekMainPageTrekData,
  aggregateTrekMainPageTrekDatesInfo,
  aggregateTrekModrateDifficultyForSliderHome,
  aggregateTrekTypeForSliderHome,
  deleteTrek,
  deleteTrekDate,
  getAllTreksForHomePage,
  patchDatesDetails,
  patchTrek,
} from "../controllers/treks.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllTreks,
  getDateDetails,
  getDatesForTrek,
  getTreksDetailsById,
} from "../controllers/adminSection.controller.js";

const router = Router();

router
  .route("/create-trek")
  .post(upload.fields([{ name: "trekImage", maxCount: 6 }]), addTrek);

router
  .route("/add-new-date/:id")
  .post(upload.fields([{ name: "trekImage", maxCount: 6 }]), addNewDateForTrek);

router.route("/delete-trek/:id").delete(deleteTrek);

router
  .route("/edit-trek/:id")
  .patch(upload.fields([{ name: "trekImage", maxCount: 6 }]), patchTrek);

router
  .route("/edit-date-details/:id")
  .patch(
    upload.fields([{ name: "trekImage", maxCount: 6 }]),
    patchDatesDetails
  );

router.route("/delete-date/:id").delete(deleteTrekDate);

router.route("/treks-all-details").get(aggregateTrekAllDetails);

router.route("/allTreksForAdmin").get(getAllTreks);

router.route("/allTreksForAdmin/:id").get(getTreksDetailsById);

router.route("/getTrekDates/:id").get(getDatesForTrek);

router.route("/getDateDetails/:id").get(getDateDetails);

// Slider Routes
router.route("/slider-all-treks").get(aggregateTrekAllDetailsForSliderHome);

router
  .route("/slider-all-treks-sortbydate")
  .get(aggregateTrekAllDetailsForSliderHomeSortByDateInAsc);

router
  .route("/slider-all-treks-sortbydatedesc")
  .get(aggregateTrekAllDetailsForSliderHomeSortByDateInDesc);

router
  .route("/slider-all-treks-sortbypriceasc")
  .get(aggregateTrekAllDetailsForSliderHomeSortByPriceInAsc);

router
  .route("/slider-all-treks-sortbypricedesc")
  .get(aggregateTrekAllDetailsForSliderHomeSortByPriceInDesc);

router
  .route("/slider-treks-with-easy")
  .get(aggregateTrekEasyDifficultyForSliderHome);

router
  .route("/slider-treks-with-modrate")
  .get(aggregateTrekModrateDifficultyForSliderHome);

router
  .route("/slider-treks-with-difficult")
  .get(aggregateTrekDifficultDifficultyForSliderHome);

router.route("/get-treks-name").get(getAllTreksForHomePage);

router.route("/getDateDetailsForClient/:id").get(getTreksDetailsById);

router
  .route("/getTrekTypeTreksForClient/:id")
  .get(aggregateTrekTypeForSliderHome);

router
  .route("/getTrekInfoDataForClientTrekMainPage/:id")
  .get(aggregateTrekMainPageTrekData);

router
  .route("/getTrekDateInfoDataForClientTrekMainPage/:id")
  .get(aggregateTrekMainPageTrekDatesInfo);

export default router;
