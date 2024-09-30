// script.js

let papers = [];
let categories = [];
let categoryCounts = {};
let histogramChart; // Declare a variable to hold the histogram chart instance

document.addEventListener('DOMContentLoaded', () => {
    // Fetch papers data from papers.json
    fetch('papers.json')
        .then(response => response.json())
        .then(data => {
            papers = data;

            // Sort the papers by 'First Read' date from latest to oldest
            papers.sort((a, b) => compareDates(b.firstRead, a.firstRead));

            // Extract categories and counts
            categoryCounts = getCategoryCounts(papers);
            categories = Object.keys(categoryCounts).sort();

            populateCategoryDropdown();
            populateTable(papers);

            // Create the 'Overall' pie chart
            createPieChart(papers, 'overallPieChart');

            // Filter papers for the past 12 months
            const papersThisYear = filterPapersByDate(papers, 12);

            // Create the 'Papers This Year' pie chart
            createPieChart(papersThisYear, 'yearPieChart');

            // Create the initial histogram
            createHistogramChart(papers, '');
        })
        .catch(error => console.error('Error fetching papers:', error));

    // Add event listeners for search input and category dropdown
    document.getElementById('searchInput').addEventListener('input', () => {
        filterPapers();
        updateHistogram();
    });
    document.getElementById('categorySelect').addEventListener('change', () => {
        filterPapers();
        updateHistogram();
    });
});

function getCategoryCounts(papers) {
    const counts = {};
    papers.forEach(paper => {
        if (counts[paper.category]) {
            counts[paper.category]++;
        } else {
            counts[paper.category] = 1;
        }
    });
    return counts;
}

function populateCategoryDropdown() {
    const categorySelect = document.getElementById('categorySelect');

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function populateTable(papersToDisplay) {
    const tbody = document.querySelector('#papersTable tbody');
    tbody.innerHTML = '';

    // Sort the papers to display by 'First Read' date from latest to oldest
    papersToDisplay.sort((a, b) => compareDates(b.firstRead, a.firstRead));

    papersToDisplay.forEach(paper => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${paper.title}</td>
            <td>${paper.category}</td>
            <td>${paper.timesRead}</td>
            <td>${paper.printed ? 'Yes' : 'No'}</td>
            <td>${paper.confidence}</td>
            <td>${paper.firstRead}</td>
        `;

        tbody.appendChild(tr);
    });
}

function filterPapers() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categorySelect').value;

    const filteredPapers = papers.filter(paper => {
        const matchesTitle = paper.title.toLowerCase().includes(searchInput);
        const matchesCategory = selectedCategory === '' || paper.category === selectedCategory;
        return matchesTitle && matchesCategory;
    });

    // Sort the filtered papers by 'First Read' date from latest to oldest
    filteredPapers.sort((a, b) => compareDates(b.firstRead, a.firstRead));

    populateTable(filteredPapers);

    // Update the histogram whenever the table is filtered
    updateHistogram();
}

function createPieChart(papersData, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const totalPapers = papersData.length;

    // Calculate category counts for the provided papersData
    const categoryCounts = getCategoryCounts(papersData);

    // Calculate percentages and combine categories under 10% into 'Other'
    const categoryData = [];
    const categoryLabels = [];
    const categoryPercentages = {};

    const otherCount = { count: 0 };

    Object.keys(categoryCounts).forEach(category => {
        const count = categoryCounts[category];
        const percentage = (count / totalPapers) * 100;

        if (percentage >= 10) {
            categoryData.push(count);
            categoryLabels.push(category);
            categoryPercentages[category] = percentage.toFixed(1);
        } else {
            otherCount.count += count;
        }
    });

    if (otherCount.count > 0) {
        categoryData.push(otherCount.count);
        categoryLabels.push('Other');
        categoryPercentages['Other'] = ((otherCount.count / totalPapers) * 100).toFixed(1);
    }

    // Generate colors for each category
    const colors = generateColors(categoryData.length);

    // Create the pie chart
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let percentage = categoryPercentages[label];
                            return `${label}: ${percentage}%`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    formatter: function(value, context) {
                        const label = context.chart.data.labels[context.dataIndex];
                        const percentage = categoryPercentages[label];
                        return `${label} (${percentage}%)`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function generateColors(count) {
    const colors = [];
    const baseColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#66FF66', '#FF6666',
        '#66FFFF', '#FF66FF', '#CCCCFF', '#FFFF99'
    ];

    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
}

// Function to compare dates in format 'Month::Year'
function compareDates(dateA, dateB) {
    const [monthA, yearA] = dateA.split('::');
    const [monthB, yearB] = dateB.split('::');

    const dateObjA = new Date(`${monthA} 1, ${yearA}`);
    const dateObjB = new Date(`${monthB} 1, ${yearB}`);

    return dateObjA - dateObjB;
}

// Function to filter papers read within the past 'months' months
function filterPapersByDate(papers, months) {
    const filteredPapers = [];
    const currentDate = new Date();

    papers.forEach(paper => {
        const [monthStr, yearStr] = paper.firstRead.split('::');
        const paperDate = new Date(`${monthStr} 1, ${yearStr}`);

        const monthDifference = (currentDate.getFullYear() - paperDate.getFullYear()) * 12 + (currentDate.getMonth() - paperDate.getMonth());

        if (monthDifference < months) {
            filteredPapers.push(paper);
        }
    });

    return filteredPapers;
}

// New functions for the histogram

function createHistogramChart(papersData, selectedCategory) {
    const ctx = document.getElementById('histogramChart').getContext('2d');

    // Filter papers based on the selected category and printed status
    const filteredPapers = papersData.filter(paper => {
        const matchesCategory = selectedCategory === '' || paper.category === selectedCategory;
        const isPrinted = paper.printed && paper.timesRead >= 1;
        return matchesCategory && isPrinted;
    });

    // Get the count of papers per month
    const monthCounts = getMonthCounts(filteredPapers);

    // Prepare data for the chart
    const labels = Object.keys(monthCounts);
    const data = Object.values(monthCounts);

    // If the chart already exists, destroy it before creating a new one
    if (histogramChart) {
        histogramChart.destroy();
    }

    // Create the histogram chart
    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Printed Papers Read per Month',
                data: data,
                backgroundColor: '#36A2EB',
                borderColor: '#2E8BC0',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month-Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Papers'
                    },
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Helper function to get the count of papers per month
function getMonthCounts(papers) {
    const counts = {};

    papers.forEach(paper => {
        const [month, year] = paper.firstRead.split('::');
        const monthYear = `${month}-${year}`;

        if (counts[monthYear]) {
            counts[monthYear]++;
        } else {
            counts[monthYear] = 1;
        }
    });

    // Sort the counts by date
    const sortedCounts = {};
    Object.keys(counts)
        .sort((a, b) => {
            const dateA = new Date(`${a.split('-')[0]} 1, ${a.split('-')[1]}`);
            const dateB = new Date(`${b.split('-')[0]} 1, ${b.split('-')[1]}`);
            return dateA - dateB;
        })
        .forEach(key => {
            sortedCounts[key] = counts[key];
        });

    return sortedCounts;
}

function updateHistogram() {
    const selectedCategory = document.getElementById('categorySelect').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // Filter papers based on the search input and selected category
    const filteredPapers = papers.filter(paper => {
        const matchesTitle = paper.title.toLowerCase().includes(searchInput);
        const matchesCategory = selectedCategory === '' || paper.category === selectedCategory;
        const isPrinted = paper.printed && paper.timesRead >= 1;
        return matchesTitle && matchesCategory && isPrinted;
    });

    createHistogramChart(filteredPapers, selectedCategory);
}
