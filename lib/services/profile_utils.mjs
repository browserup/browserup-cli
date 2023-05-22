// usage
//import ProfileUtils from "./path/to/profileUtils.js";
//
// // Use the populatePercents method
// const profileArr = [
//   // Your array of profiles
// ];
// const result = ProfileUtils.populatePercents(profileArr);
// log.info(result);

export class ProfileUtils {
    static populatePercents(profileArr) {
        let tot = 0;
        let undefinedCount = 0;

        profileArr.forEach((prof) => {
            tot += parseInt(prof.allocation, 10) || 0;
            if (!prof.allocation) undefinedCount += 1;
        });

        let remaining = 100 - tot;
        let [amount, remainder] = divmod(remaining, undefinedCount);

        profileArr.forEach((prof) => {
            if (!prof.allocation) {
                prof.allocation = (amount + remainder).toString() + "%";
                remainder = 0;
            }
        });

        return profileArr;
    }
}

function divmod(dividend, divisor) {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    return [quotient, remainder];
}
