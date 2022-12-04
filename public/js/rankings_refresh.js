const progressElement = document.getElementById("rankings-refresh-label-progress")
const progressBackgroundElement = document.getElementById("rankings-refresh-label-background")

const refreshDelay = 8000 // how often, in ms, the progress is refreshed

const percentageFormat = (number) => {
    const percentage = number * 100 // turn into a full percentage value
    
    return (Math.round(percentage * 10)/10) + "%"
}

const refreshPage = () => {
    window.location.reload()
}

const updateRefreshProgress = () => {
    fetch("/api/v1/updating")
        .then(data => data.json())
        .then(data => {
            
            const body = data["Body"]

            if (body && body['updating']) {
                const progress = percentageFormat(body['progress'])
                progressElement.innerText = progress
                progressBackgroundElement.style.width = progress

                setTimeout(updateRefreshProgress, refreshDelay)
            } else {
                refreshPage() // refresh the page if no longer updating
            }

        }).catch(_ => { refreshPage() })
}

if (progressElement && progressBackgroundElement) {
    updateRefreshProgress()
}