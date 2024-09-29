// script.js

let papers = [];
let categories = [];

document.addEventListener('DOMContentLoaded', () => {
    // Fetch papers data from papers.json
    fetch('papers.json')
        .then(response => response.json())
        .then(data => {
            papers = data;

            // Extract unique categories and sort them
            categories = [...new Set(papers.map(paper => paper.category))].sort();

            populateCategoryDropdown();
            populateTable(papers);
        })
        .catch(error => console.error('Error fetching papers:', error));

    // Add event listeners for search input and category dropdown
    document.getElementById('searchInput').addEventListener('input', filterPapers);
    document.getElementById('categorySelect').addEventListener('change', filterPapers);
});

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

    papersToDisplay.forEach(paper => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${paper.title}</td>
            <td>${paper.category}</td>
            <td>${paper.timesRead}</td>
            <td>${paper.printed ? 'Yes' : 'No'}</td>
            <td>${paper.confidence}</td>
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

    populateTable(filteredPapers);
}
