import Reservation from "../../models/Reservation.js";
import { expireReservationIfDue } from "./reservationExpiration.service.js";

const INTERVAL_MS = 30_000;
const BATCH_SIZE = 100;

let isRunning = false;

export function startReservationExpirationJob(): void {
  console.log("Reservation expiration job started.");

  const run = async () => {
    // Prevent overlapping runs within this process.
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      const expiredCandidates = await Reservation.find({
        status: "ACTIVE",
        expiresAt: { $lte: new Date() },
      })
        .select("_id")
        .sort({ expiresAt: 1 })
        .limit(BATCH_SIZE)
        .lean();

      for (const candidate of expiredCandidates) {
        try {
          const didExpire = await expireReservationIfDue(
            candidate._id.toString(),
          );

          if (didExpire) {
            console.log(`Expired reservation: ${candidate._id.toString()}`);
          }
        } catch (error) {
          console.error(
            `Failed to expire reservation ${candidate._id.toString()}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("Reservation expiration job failed:", error);
    } finally {
      isRunning = false;
    }
  };

  // Process overdue reservations shortly after startup.
  void run();

  // Continue checking every 30 seconds.
  setInterval(() => {
    void run();
  }, INTERVAL_MS);
}
