document.addEventListener('DOMContentLoaded', () => {
  const diceViewport = document.getElementById('diceViewport');
  const diceCountSelect = document.getElementById('diceCountSelect');
  const diceThemeSelect = document.getElementById('diceThemeSelect');
  const rollBtn = document.getElementById('rollBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  // Stats Elements
  const statTotalRolls = document.getElementById('statTotalRolls');
  const statLastSum = document.getElementById('statLastSum');
  const statAverage = document.getElementById('statAverage');
  const statHighestSum = document.getElementById('statHighestSum');

  // App State
  let state = {
    totalRolls: 0,
    totalSum: 0,
    highestSum: 0,
    history: []
  };

  // Load state from localStorage if available
  const savedState = localStorage.getItem('dice_roller_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      updateStatsUI();
      renderHistoryUI();
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }

  // Face rotation definitions
  const faceRotations = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: 180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 90, y: 0 }
  };

  // Initialize dice elements on the viewport
  function initDice() {
    diceViewport.innerHTML = '';
    const count = parseInt(diceCountSelect.value, 10);
    const theme = diceThemeSelect.value;

    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'dice-wrapper';

      const dice = document.createElement('div');
      dice.className = `dice ${theme}`;
      dice.id = `dice-${i}`;

      // Create all 6 faces
      for (let faceNum = 1; faceNum <= 6; faceNum++) {
        const face = document.createElement('div');
        face.className = `dice-face face-${faceNum}`;

        // Create correct number of dots for this face
        for (let dotNum = 0; dotNum < faceNum; dotNum++) {
          const dot = document.createElement('div');
          dot.className = 'dot';
          face.appendChild(dot);
        }

        dice.appendChild(face);
      }

      // Initial rotation showing face 1
      dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
      wrapper.appendChild(dice);
      diceViewport.appendChild(wrapper);
    }
  }

  // Roll All Dice
  function rollDice() {
    if (rollBtn.disabled) return;

    rollBtn.disabled = true;
    const count = parseInt(diceCountSelect.value, 10);
    const diceElements = diceViewport.querySelectorAll('.dice');
    const rolledValues = [];

    // Rolling animation starts
    diceElements.forEach((dice, index) => {
      const targetValue = Math.floor(Math.random() * 6) + 1;
      rolledValues.push(targetValue);

      // Generate random extra spins (3 to 5 full spins)
      const spinX = (Math.floor(Math.random() * 3) + 3) * 360;
      const spinY = (Math.floor(Math.random() * 3) + 3) * 360;

      const rot = faceRotations[targetValue];
      
      // Calculate final degrees
      const targetX = rot.x + spinX;
      const targetY = rot.y + spinY;

      // Apply style
      dice.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
    });

    // Wait for the transition to finish (1.2s in CSS)
    setTimeout(() => {
      processRollResults(rolledValues);
      rollBtn.disabled = false;
    }, 1200);
  }

  // Handle calculation and storage of results
  function processRollResults(values) {
    const sum = values.reduce((a, b) => a + b, 0);

    // Update state
    state.totalRolls += 1;
    state.totalSum += sum;
    if (sum > state.highestSum) {
      state.highestSum = sum;
    }

    const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const rollLog = {
      timestamp,
      values,
      sum
    };

    state.history.unshift(rollLog);
    if (state.history.length > 50) {
      state.history.pop(); // Keep only last 50 rolls
    }

    // Save to local storage
    localStorage.setItem('dice_roller_state', JSON.stringify(state));

    // Update UIs
    updateStatsUI(sum);
    renderHistoryUI();
  }

  function updateStatsUI(lastSum = null) {
    statTotalRolls.textContent = state.totalRolls;
    statLastSum.textContent = lastSum !== null ? lastSum : (state.history[0]?.sum || 0);
    statHighestSum.textContent = state.highestSum;

    if (state.totalRolls > 0) {
      const avg = (state.totalSum / state.totalRolls).toFixed(1);
      statAverage.textContent = avg;
    } else {
      statAverage.textContent = '0.0';
    }
  }

  function renderHistoryUI() {
    historyList.innerHTML = '';
    state.history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const timeSpan = document.createElement('span');
      timeSpan.style.color = 'var(--text-secondary)';
      timeSpan.style.fontSize = '0.85rem';
      timeSpan.textContent = item.timestamp;

      const diceValuesDiv = document.createElement('div');
      diceValuesDiv.className = 'history-dice-values';

      item.values.forEach(val => {
        const badge = document.createElement('span');
        badge.className = 'history-die-badge';
        badge.textContent = val;
        diceValuesDiv.appendChild(badge);
      });

      const sumSpan = document.createElement('strong');
      sumSpan.style.color = 'var(--accent-secondary)';
      sumSpan.textContent = `합계: ${item.sum}`;

      li.appendChild(timeSpan);
      li.appendChild(diceValuesDiv);
      li.appendChild(sumSpan);

      historyList.appendChild(li);
    });
  }

  // Clear History
  function clearHistory() {
    state = {
      totalRolls: 0,
      totalSum: 0,
      highestSum: 0,
      history: []
    };
    localStorage.removeItem('dice_roller_state');
    updateStatsUI();
    renderHistoryUI();
  }

  // Event Listeners
  diceCountSelect.addEventListener('change', initDice);
  diceThemeSelect.addEventListener('change', () => {
    const diceElements = diceViewport.querySelectorAll('.dice');
    const theme = diceThemeSelect.value;
    diceElements.forEach(dice => {
      // Remove other themes
      dice.className = `dice ${theme}`;
    });
  });

  rollBtn.addEventListener('click', rollDice);
  clearHistoryBtn.addEventListener('click', clearHistory);

  // Initialize on load
  initDice();
});
