document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let currentInput = '0';
    let hasCalculated = false;
    
    const stats = {
        total: 0,
        correct: 0,
        faulty: 0
    };

    // UI Elements
    const historyDisplay = document.getElementById('historyDisplay');
    const inputDisplay = document.getElementById('inputDisplay');
    const calcScreen = document.getElementById('calcScreen');
    
    const diagnosticsDrawer = document.getElementById('diagnosticsDrawer');
    const toggleDrawerBtn = document.getElementById('toggleDrawerBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    
    const statTotal = document.getElementById('statTotal');
    const statCorrect = document.getElementById('statCorrect');
    const statFaulty = document.getElementById('statFaulty');
    const historyList = document.getElementById('historyList');

    // Drawer Toggles
    toggleDrawerBtn.addEventListener('click', () => {
        diagnosticsDrawer.classList.toggle('collapsed');
    });

    closeDrawerBtn.addEventListener('click', () => {
        diagnosticsDrawer.classList.add('collapsed');
    });

    // Helper: Update display values
    function updateDisplay() {
        // Replace internal operator characters with beautiful visual ones
        let visualInput = currentInput
            .replace(/\//g, ' ÷ ')
            .replace(/\*/g, ' × ')
            .replace(/\+/g, ' + ')
            .replace(/-/g, ' − ');
            
        inputDisplay.textContent = visualInput || '0';
        
        // Auto scroll display to the right if input gets too long
        inputDisplay.scrollLeft = inputDisplay.scrollWidth;
    }

    // Helper: Safe evaluation
    function safeEval(expression) {
        // Allow only numbers, decimal, and basic operators
        const sanitised = expression.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitised) return '0';
        
        try {
            // Use Function constructor for safe client-side math execution
            const result = new Function(`return (${sanitised})`)();
            
            if (result === undefined || isNaN(result) || !isFinite(result)) {
                return 'Error';
            }
            
            // Limit floating point issues (e.g. 0.1 + 0.2) by rounding to 8 decimals
            return Number(result.toFixed(8)).toString();
        } catch (e) {
            return 'Error';
        }
    }

    // Operation: Percentage
    function handlePercent() {
        if (hasCalculated) {
            hasCalculated = false;
        }
        
        // Find the last number in the expression and divide it by 100
        const match = currentInput.match(/(\d+\.?\d*)$/);
        if (match) {
            const lastNumber = match[1];
            const percentValue = (parseFloat(lastNumber) / 100).toString();
            currentInput = currentInput.slice(0, -lastNumber.length) + percentValue;
            updateDisplay();
        }
    }

    // Operation: Backspace/Delete
    function handleDelete() {
        if (hasCalculated) {
            currentInput = '0';
            hasCalculated = false;
        } else if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
        } else {
            currentInput = '0';
        }
        updateDisplay();
    }

    // Operation: Clear All
    function handleClear() {
        currentInput = '0';
        historyDisplay.textContent = '';
        hasCalculated = false;
        updateDisplay();
    }

    // Append standard character (number, decimal, operator)
    function handleInput(val) {
        const operators = ['+', '-', '*', '/'];
        const isOperator = operators.includes(val);
        
        if (hasCalculated) {
            if (isOperator) {
                // Continue calculating with previous result
                hasCalculated = false;
            } else {
                // Start a new calculation
                currentInput = '0';
                hasCalculated = false;
            }
        }

        const lastChar = currentInput.slice(-1);

        // Prevent double decimals in a single number block
        if (val === '.') {
            const parts = currentInput.split(/[\+\-\*\/]/);
            const currentNumber = parts[parts.length - 1];
            if (currentNumber.includes('.')) {
                return;
            }
        }

        if (currentInput === '0' && !isOperator && val !== '.') {
            // Overwrite initial 0
            currentInput = val;
        } else if (isOperator && operators.includes(lastChar)) {
            // Replace previous operator with the new one
            currentInput = currentInput.slice(0, -1) + val;
        } else {
            // Normal append
            currentInput += val;
        }
        
        updateDisplay();
    }

    // Core logic: Equal & Fault Mechanism
    function calculate() {
        let expression = currentInput.trim();
        if (!expression || expression === '0') return;

        // Clean trailing operators if any
        const operators = ['+', '-', '*', '/'];
        if (operators.includes(expression.slice(-1))) {
            expression = expression.slice(0, -1);
        }

        // Check if there are actual operators to evaluate
        const hasOperators = expression.split('').some(char => operators.includes(char));
        if (!hasOperators) return;

        // Determine if this run will be faulty (10% chance)
        const isFaulty = Math.random() < 0.10;
        
        let result = '';
        let evaluatedExpression = expression;
        
        const operatorMap = {
            '+': '-',
            '-': '+',
            '*': '/',
            '/': '*'
        };

        if (isFaulty) {
            // Glitch screen animation
            calcScreen.classList.add('glitch-flicker');
            setTimeout(() => {
                calcScreen.classList.remove('glitch-flicker');
            }, 350);

            // Swap all mathematical operators
            evaluatedExpression = expression.replace(/[\+\-\*\/]/g, match => operatorMap[match]);
            result = safeEval(evaluatedExpression);
            
            stats.faulty++;
        } else {
            result = safeEval(expression);
            stats.correct++;
        }

        stats.total++;

        // Update UI displays
        historyDisplay.textContent = expression
            .replace(/\//g, ' ÷ ')
            .replace(/\*/g, ' × ')
            .replace(/\+/g, ' + ')
            .replace(/-/g, ' − ') + ' =';
            
        inputDisplay.textContent = result;
        currentInput = result === 'Error' ? '0' : result;
        hasCalculated = true;

        // Update Diagnostics UI
        updateDiagnostics(expression, result, isFaulty, evaluatedExpression);
    }

    // Add Item to Diagnostics drawer
    function updateDiagnostics(originalExpr, result, isFaulty, evaluatedExpr) {
        // Update counters
        statTotal.textContent = stats.total;
        statCorrect.textContent = stats.correct;
        statFaulty.textContent = stats.faulty;

        // Remove empty placeholder if first run
        const emptyPlaceholder = historyList.querySelector('.empty-history');
        if (emptyPlaceholder) {
            emptyPlaceholder.remove();
        }

        // Format visual representations
        const visualOriginal = originalExpr
            .replace(/\//g, '÷')
            .replace(/\*/g, '×');
            
        const visualEvaluated = evaluatedExpr
            .replace(/\//g, '÷')
            .replace(/\*/g, '×');

        // Create log item HTML
        const item = document.createElement('div');
        item.className = 'history-item';
        
        item.innerHTML = `
            <div class="history-item-top">
                <span class="history-formula">${visualOriginal}</span>
                <span class="badge ${isFaulty ? 'badge-faulty' : 'badge-success'}">
                    ${isFaulty ? 'Faulty' : 'Correct'}
                </span>
            </div>
            <div class="history-result-row">
                <span class="history-actual-result">Result: ${result}</span>
                ${isFaulty ? `<span class="history-fault-info">Fault: Swapped to ${visualEvaluated}</span>` : ''}
            </div>
        `;

        // Prepend to top of logs
        historyList.insertBefore(item, historyList.firstChild);
    }

    // Setup Click Event Listeners for Buttons
    document.querySelectorAll('.calc-btn').forEach(button => {
        button.addEventListener('click', () => {
            const val = button.getAttribute('data-val');
            const action = button.getAttribute('data-action');
            
            if (val !== null) {
                handleInput(val);
            } else if (action) {
                switch (action) {
                    case 'clear':
                        handleClear();
                        break;
                    case 'delete':
                        handleDelete();
                        break;
                    case 'percent':
                        handlePercent();
                        break;
                    case 'calculate':
                        calculate();
                        break;
                }
            }
        });
    });

    // Keyboard support Mapping
    const keyboardMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
        'Enter': '=', '=': '=',
        'Backspace': 'Backspace',
        'Escape': 'Escape',
        'c': 'Escape', 'C': 'Escape',
        '%': '%'
    };

    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (keyboardMap[key] !== undefined) {
            e.preventDefault(); // Prevent standard browser scroll/shortcut
            
            const action = keyboardMap[key];
            
            // Find corresponding HTML button to trigger active class & action
            let btnSelector = '';
            if (action === '=') {
                btnSelector = '[data-action="calculate"]';
            } else if (action === 'Backspace') {
                btnSelector = '[data-action="delete"]';
            } else if (action === 'Escape') {
                btnSelector = '[data-action="clear"]';
            } else if (action === '%') {
                btnSelector = '[data-action="percent"]';
            } else {
                btnSelector = `[data-val="${action}"]`;
            }
            
            const btn = document.querySelector(btnSelector);
            if (btn) {
                btn.classList.add('kbd-active');
                setTimeout(() => btn.classList.remove('kbd-active'), 100);
                btn.click();
            }
        }
    });
});