document.addEventListener("DOMContentLoaded", () => {
    const classEntries = document.getElementById("class-entries");
    const calculateGPAButton = document.getElementById("calculate-gpa");
    const gpaResult = document.getElementById("gpa-result");
    const graduationRequirements = {
        "Math": 20, "Science": 20, "English": 40, "Social Studies": 30, "Health": 5, "Fine Art or World Language": 10, "Total": 220,
    };
    const enteredClasses = [];
    
    const initializeSelect2 = (selector) => {
        $('#class-select').select2({placeholder: 'Search for a class', minimumInputLength: 3});
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

        classes.forEach(entry => {
            const grade = entry.dataset.grade;
            const classType = entry.dataset.type;
            const term = entry.dataset.duration;

            const typeMultipliers = {
                "Regular": 1.0,
                "Honors": 1.25,
                "AP": 1.25,
                "Dual Enrollment": 1.25
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
    
        const fulfilled = { ...graduationRequirements };
        for (const subject in fulfilled) fulfilled[subject] = 0;
    
        const classes = document.getElementById('class-list').querySelectorAll('.class-entry');
        
        classes.forEach(classEntry => {
            try {
                const classData = JSON.parse(classEntry.dataset.originalData);
                const duration = classData.duration;
                const subject = classData.subject;
    
                const credits = duration === 'Year' ? 10 : 
                              duration === 'Semester' ? 5 : 
                              duration === 'Quarter' ? 2.5 : 0;
    
                fulfilled.Total += credits;
    
            if (subject === 'Fine Art' || subject === 'World Language') {
                fulfilled['Fine Art or World Language'] += credits;
            }
            else if (subject === 'Social Studies') {
                fulfilled['Social Studies'] += credits;
            }
            else if (subject in fulfilled) {
                fulfilled[subject] += credits;
            }
        } catch (error) {
            console.error('Error processing class entry:', error);
        }
    });
    
        for (const subject in graduationRequirements) {
            const required = graduationRequirements[subject];
            const earned = fulfilled[subject];
            const item = document.createElement('li');
            
            const percentage = (earned / required) * 100;
            
            let displayText = subject;
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span>${displayText}: ${earned >= required ? 'Completed' : 'In Progress'} (${earned}/${required})</span>
                    <div style="width: 200px; height: 20px; background-color: #eee; border-radius: 10px; overflow: hidden;">
                        <div style="width: ${Math.min(percentage, 100)}%; height: 100%; background-color: ${earned >= required ? '#4CAF50' : '#FFA500'}; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
            requirementList.appendChild(item);
        }
    });
});