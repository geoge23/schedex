# SCHEDEX

SCHEDEX downloads and parses the schedule for Woodward Academy in Atlanta, GA. It then uploads the schedule to 
the MongoDB database powering [WADaily](https://github.com/geoge23/wadaily).

## Environment Variables
| Variable | Description |
| -------- | ----------- |
| `MONGO_URI` | The URI of the MongoDB database. It always uses the `wadaily` collection |
| `VERACROSS_USERNAME` | The username for the Woodward Academy Veracross website. Credentials must be valid for a parent account with access to the Upper School |
| `VERACROSS_PASSWORD` | The password for the Woodward Academy Veracross website. Credentials must be valid for a parent account with access to the Upper School |

## Filtering Logic
SCHEDEX finds Veracross calendar events for the current and following week. It then filters events to find all with a background color of black (The color of the calendar containing schedule days). These days are parsed by checking `event.description`, which contains text. 

## Docker
SCHEDEX is designed to be run in a Docker container. The container is one-shot, and will connect to the MongoDB instance and download schedules automatically. The image is available on GHCR at `ghcr.io/geoge23/schedex:latest`. To schedule the container to run every day at 3:00 AM, add the following to your crontab:

```cron
0 3 * * * docker run --rm -e MONGO_URI=<MONGO_URI> -e VERACROSS_USERNAME=<VERACROSS_USERNAME> -e VERACROSS_PASSWORD=<VERACROSS_PASSWORD> ghcr.io/geoge23/schedex:latest
```
