var chartConfig = {
    type: 'line',
    data: {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [{
            label: "My First dataset",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [
                0.1,
                0.1,
                0.3,
                0.2,
                0.1,
                0.69,
                0.5,
            ],
            fill: false,
        }]
    },
    options: {
        responsive: true,
        title:{
            display:true,
            text:'Layout Parameter Similarity'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Month'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
    }
};

function showSimilarityChart(snapshotDates, datasets){
    var ctx = document.getElementById("canvas").getContext("2d");
    var default_colors = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC'];
    chartConfig.data.labels = snapshotDates;
    datasets = datasets.map(function(data,i){
       data.backgroundColor = default_colors[i];
       data.borderColor = default_colors[i];
       data.fill = false;
       data.borderWidth = 1;
       return data;
    });
    chartConfig.data.datasets = datasets;
    window.myLine = new Chart(ctx, chartConfig);
}