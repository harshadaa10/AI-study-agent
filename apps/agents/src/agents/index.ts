export const helloWorld = "Hello from Bun agents!";

console.log(helloWorld);

export { getRevisionQueue, markNoteReviewed } from "./revisionAgent";
export { goalTrackerAgent } from "./goalTrackerAgent";
