document.addEventListener("DOMContentLoaded", () => {
    const classEntries = document.getElementById("class-entries");
    const calculateGPAButton = document.getElementById("calculate-gpa");
    const gpaResult = document.getElementById("gpa-result");
    const graduationRequirements = {
        "Social Studies": {
            total: 30,
            subcategories: {
                "World History": {
                    required: 10,
                    fulfilled: 0,
                    patterns: ["World History"]
                },
                "US History": {
                    required: 10,
                    fulfilled: 0,
                    patterns: ["US History", "HIST 102"]
                },
                "US Government": {
                    required: 5,
                    fulfilled: 0,
                    patterns: ["US Government", "AP US Government", "POLI 1"]
                },
                "Economics": {
                    required: 5,
                    fulfilled: 0,
                    patterns: ["Economics", "AP Economics", "ECON 100"]
                }
            }
        },
        "Science": {
            total: 20,
            subcategories: {
                "Biology": {
                    required: 10,
                    fulfilled: 0,
                    patterns: ["Biology: The Living Earth", "Honors Biology", "AP Biology"]
                },
                "Physical Science": {
                    required: 10,
                    fulfilled: 0,
                    patterns: ["Chemistry of the Earth", "Honors Chemistry", "AP Chemistry", "Earth and Space Science"]
                }
            }
        },
        "English": 40,
        "Math": 20,
        "Fine Art or World Language": 10,
        "PE/Sport": 20,
        "Health": 5,
        "Total": 220
    };
    const enteredClasses = [];
    
    const initializeSelect2 = (selector) => {
        $('#class-select').select2({placeholder: 'Search for a class', minimumInputLength: 2});
    };
    initializeSelect2('#class-select');

    fetch('classes.json')
        .then(response => response.json())
        .then(classes => {
            const classSelect = $('#class-select');
            classes.forEach(cls => {
                const option = new Option(
                    `${cls.name} (Term: ${cls.duration})`,
                    JSON.stringify(cls),
                    false,
                    false
                );
                classSelect.append(option);
            });
            classSelect.trigger('change');
        });

    document.getElementById('add-class').addEventListener('click', () => {
        const selectedClassElement = document.getElementById('class-select');
        const selectedGrade = document.querySelector('.class-grade').value;

        if (selectedClassElement.value) {
            const classData = JSON.parse(selectedClassElement.value);

            const newEntry = document.createElement('div');
            newEntry.classList.add('class-entry');
            newEntry.dataset.type = classData.type;
            newEntry.dataset.grade = selectedGrade;
            newEntry.dataset.duration = classData.duration;
            newEntry.dataset.originalData = selectedClassElement.value;
            
            newEntry.innerHTML = `
                <span class="class-name">${classData.name}</span>
                <span class="class-type">Class Type: ${classData.type}</span>
                <span class="class-duration">Term: ${classData.duration}</span>
                <span class="class-grade">Grade: ${selectedGrade}</span>
                <button class="remove-class">Remove</button>
            `;
            
            document.getElementById('class-list').appendChild(newEntry);
            enteredClasses.push(classData);

            selectedClassElement.value = '';
            $(selectedClassElement).trigger('change');

            newEntry.querySelector(".remove-class").addEventListener("click", () => {
                newEntry.remove();
                enteredClasses.splice(enteredClasses.indexOf(classData), 1);
            });
        } else {
            alert("Please select a class.");
        }
    });

    calculateGPAButton.addEventListener("click", () => {
        const classes = document.getElementById('class-list').querySelectorAll(".class-entry");

        if (classes.length === 0) {
            gpaResult.textContent = "Please add at least one class.";
            return;
        }

        let totalPoints = 0, totalCredits = 0;
        let academicClasses = 0;

        classes.forEach(entry => {
            const classData = JSON.parse(entry.dataset.originalData);
            
            if (classData.subject === "PE/Sport") {
                return;
            }

            const grade = entry.dataset.grade;
            const classType = entry.dataset.type;
            const term = entry.dataset.duration;

            const typeMultipliers = {
                "Regular": 1.0,
                "Honors": 1.25,
                "AP": 1.25,
                "Dual Enrollment (Partnership)": 1.25
            };

            const baseGradePoints = {
                "A": 4.0,
                "B": 3.0,
                "C": 2.0,
                "D": 1.0,
                "F": 0.0
            };

            const termCredits = {
                "Quarter": 2.5,
                "Semester": 5,
                "Year": 10
            };

            const multiplier = typeMultipliers[classType] || 1.0;
            const basePoints = baseGradePoints[grade];
            const credits = termCredits[term] || 5;

            if (basePoints === undefined) {
                console.error(`Invalid grade: ${grade}`);
                return;
            }

            const gradePoints = basePoints * multiplier;
            totalCredits += credits;
            totalPoints += gradePoints * credits;
        });

        if (totalCredits === 0) {
            gpaResult.textContent = "No valid grades found to calculate GPA.";
            return;
        }

        const weightedGPA = (totalPoints / totalCredits).toFixed(4);
        gpaResult.textContent = `Your predicted GPA is ${weightedGPA}.`;
    });

    document.getElementById('check-requirements').addEventListener('click', () => {
        const requirementList = document.getElementById('requirement-list');
        requirementList.innerHTML = '';
        
        const fulfilled = {
            "Social Studies": {
                total: 0,
                subcategories: JSON.parse(JSON.stringify(graduationRequirements["Social Studies"].subcategories))
            },
            "Science": {
                total: 0,
                subcategories: JSON.parse(JSON.stringify(graduationRequirements["Science"].subcategories))
            }
        };
        
        for (const subject in graduationRequirements) {
            if (typeof graduationRequirements[subject] === 'number') {
                fulfilled[subject] = 0;
            }
        }

        const classes = document.getElementById('class-list').querySelectorAll('.class-entry');
        
        classes.forEach(classEntry => {
            try {
                const classData = JSON.parse(classEntry.dataset.originalData);
                const duration = classData.duration;
                const subject = classData.subject;
                const name = classData.name;
                const grade = classEntry.dataset.grade;

                if (grade === 'F') return;

                const credits = duration === 'Year' ? 10 : 
                              duration === 'Semester' ? 5 : 
                              duration === 'Quarter' ? 2.5 : 0;

                fulfilled.Total += credits;

                if (subject === 'Social Studies') {
                    fulfilled["Social Studies"].total += credits;
                    
                    for (const subcat in fulfilled["Social Studies"].subcategories) {
                        const patterns = fulfilled["Social Studies"].subcategories[subcat].patterns;
                        if (patterns.some(pattern => name.includes(pattern))) {
                            fulfilled["Social Studies"].subcategories[subcat].fulfilled += credits;
                        }
                    }
                }
                else if (subject === 'Science') {
                    fulfilled["Science"].total += credits;
                    
                    for (const subcat in fulfilled["Science"].subcategories) {
                        const patterns = fulfilled["Science"].subcategories[subcat].patterns;
                        if (patterns.some(pattern => name.includes(pattern))) {
                            fulfilled["Science"].subcategories[subcat].fulfilled += credits;
                        }
                    }
                }
                else if (subject === 'Fine Art' || subject === 'World Language') {
                    fulfilled['Fine Art or World Language'] += credits;
                }
                else if (subject in fulfilled) {
                    fulfilled[subject] += credits;
                }
            } catch (error) {
                console.error('Error processing class entry:', error);
            }
        });

        for (const subject in graduationRequirements) {
            const item = document.createElement('li');
            
            if (subject === 'Social Studies' || subject === 'Science') {
                const subjectData = graduationRequirements[subject];
                const fulfilledData = fulfilled[subject];
                
                let subcategoryHTML = `
                    <div class="requirement-category">
                        <h3>${subject} (${fulfilledData.total}/${subjectData.total} total credits)</h3>
                        <div class="subcategories">
                `;
                
                for (const subcat in subjectData.subcategories) {
                    const required = subjectData.subcategories[subcat].required;
                    const earned = fulfilledData.subcategories[subcat].fulfilled;
                    const percentage = (earned / required) * 100;
                    
                    subcategoryHTML += `
                        <div class="subcategory">
                            <span>${subcat}: ${earned >= required ? 'Completed' : 'In Progress'} (${earned}/${required})</span>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${Math.min(percentage, 100)}%; background-color: ${earned >= required ? '#4CAF50' : '#FFA500'};"></div>
                            </div>
                        </div>
                    `;
                }
                
                subcategoryHTML += '</div></div>';
                item.innerHTML = subcategoryHTML;
            } else {
                const required = graduationRequirements[subject];
                const earned = fulfilled[subject];
                const percentage = (earned / required) * 100;
                
                item.innerHTML = `
                    <div class="requirement-item">
                        <span>${subject}: ${earned >= required ? 'Completed' : 'In Progress'} (${earned}/${required})</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(percentage, 100)}%; background-color: ${earned >= required ? '#4CAF50' : '#FFA500'};"></div>
                        </div>
                    </div>
                `;
            }
            
            requirementList.appendChild(item);
        }
    });
});
