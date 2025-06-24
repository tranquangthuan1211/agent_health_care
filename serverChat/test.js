import doctorFunction from "./functionCalling/doctorFunction.js";
import specialtyFunction from "./functionCalling/specialtyFunction.js";
import diseasesFunction from "./functionCalling/diseasesFunction.js";
import messageFunction from "./functionCalling/messageFunction.js";

const test = async () => {
    try {
        console.log("Starting function calls...");
        const message = await messageFunction.getMessage(1);
        console.log("Message function call completed.", message);
        // const [result, diseaseResult, specialtyResult] = await Promise.all([
        //     doctorFunction.getDoctor(),
        //     diseasesFunction.getDisease(),
        //     specialtyFunction.getSpecialty()
        // ]);

        // console.log("Function call result:", result);
        // console.log("Disease function call result:", diseaseResult);
        // console.log("Specialty function call result:", specialtyResult);
    } catch (error) {
        console.error("Error during one of the function calls:", error);
    }

    console.log("All function calls completed.");
};

test();
