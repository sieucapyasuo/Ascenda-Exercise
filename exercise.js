const { readFileSync, writeFileSync } = require("fs");

const fileName = "input.json";
const data = readFileSync(fileName);
const offers = JSON.parse(data).offers;

const isValidDateFormat = (dateString) => {
  // Define the regular expression pattern for "YYYY-MM-DD" format
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateFormatRegex.test(dateString)) {
    return false;
  }
  const [year, month, day] = dateString.split("-").map(Number);
  if (month < 1 || month > 12) {
    return false;
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return false;
  }

  return true;
};

try {
  // Checks for --date and if it has a value
  const dateIndex = process.argv.indexOf("--date");
  let argDate;
  if (dateIndex > -1) {
    // Retrieve the value after --date
    argDate = process.argv[dateIndex + 1];
  }

  if (!isValidDateFormat(argDate)) throw Error("Invalid date !");

  const isOfferValid = (offer) => {
    if (offer.category == 3) return false;
    if (Date(offer["valid_to"]) - Date(argDate) < 432000000) return false; //check if the date is greater than 5 days
    return true;
  };

  const getClosetMerchant = (merchants) => {
    return merchants.reduce((prev, current) =>
      prev.distance < current.distance ? prev : current
    );
  };

  const get2ClosetOffers = (offers) => {
    let firstClosetOffer;
    let secondClosetOffer;

    // There are many ways to find 2 closet offers like sorting with O(NlogN)
    // or we could find them in just one time of looping O(N).
    // But i prefer seperating the process into 2 loops for readability.

    // find the first closet offer O(N)
    let minDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < offers.length; i++) {
      if (offers[i].merchants[0].distance < minDistance) {
        firstClosetOffer = offers[i];
        minDistance = offers[i].merchants[0].distance;
      }
    }

    // find the second closet offer O(N)
    minDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < offers.length; i++) {
      if (
        offers[i].merchants[0].distance < minDistance &&
        offers[i].id != firstClosetOffer.id && // check if it is distinct from the first
        offers[i].category != firstClosetOffer.category
      ) {
        // check if it is not in the same catetgory
        secondClosetOffer = offers[i];
        minDistance = offers[i].merchants[0].distance;
      }
    }

    /// in some cases, there is only 1 offer suitable so we should check if the second one is null
    let res = [firstClosetOffer];
    if (secondClosetOffer) res.push(secondClosetOffer);
    return res;
  };

  const filteredOffers = offers.filter((offer) => {
    if (isOfferValid(offer)) {
      ///if an offer is valid and it has many merchants, we will get the closet
      if (offer.merchants.length > 1)
        offer.merchants = [getClosetMerchant(offer.merchants)];
      return true;
    }
    return false;
  });

  writeFileSync(
    "output.json",
    JSON.stringify({ offers: get2ClosetOffers(filteredOffers) })
  );
} catch (e) {
  console.error(e.message);
}
