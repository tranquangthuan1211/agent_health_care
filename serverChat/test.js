import doctorFunction from "./functionCalling/doctorFunction.js";

const test = async () => {
    try {
        const result = await doctorFunction.getDoctor();
        console.log("Function call result:", result);
    } catch (error) {
        console.error("Error during function call:", error);
    }
}
test();
