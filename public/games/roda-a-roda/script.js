class RodaARodaGame {
  constructor() {
    // --- Elementos da UI ---
    
    this.gameModeMenu = document.getElementById("game-mode-menu");
    this.modeButtons = document.querySelectorAll(".mode-button");
    this.initialConfigModal = document.getElementById("initial-config-modal");
    this.initialConfigTitle = document.getElementById("initial-config-title");
    this.gameTitleInput = document.getElementById("game-title");
    this.playerCountSelector = document.getElementById("player-count");
    this.loadCsvInitialButton = document.getElementById("load-csv-initial");
    this.csvUploadInitialInput = document.getElementById("csv-upload-initial");
    this.csvStatusInitial = document.getElementById("csv-status-initial");
    this.themeSelectorInitial = document.getElementById("theme-initial");
    this.startGameBtn = document.getElementById("start-game-btn");
    this.gameArea = document.getElementById("game-area");
    this.tituloRoleta = document.getElementById("titulo-roleta");
    this.alphabetContainer = document.getElementById("alphabet");
    this.gridContainer = document.getElementById("grid-container");
    this.roleta = document.getElementById("roleta");
    this.logoSpace = document.getElementById("logo-space");
    this.spinButton = document.getElementById("spin-button");
    this.hintText = document.getElementById("hint-text");
    this.scoreboardContainer = document.getElementById("scoreboard");
    this.statusIndicator = document.getElementById("status-indicator");
    this.wordPointsDisplay = document.getElementById("word-points-display");
    this.passButton = document.getElementById("pass-button");
    this.revealButton = document.getElementById("reveal-button");
    this.timerButton = document.getElementById("timer-button");
    this.soundToggle = document.getElementById("sound-toggle");
    this.ingameConfigButton = document.getElementById("ingame-config-button");
    this.ingameConfigModal = document.getElementById("ingame-config-modal");
    this.closeIngameConfigModalButton = document.getElementById("close-ingame-config-modal");
    this.configTabLinks = document.querySelectorAll("#ingame-config-modal .config-tabs .tab-link");
    this.configTabContents = document.querySelectorAll("#ingame-config-modal .modal-content > .tab-content");
    this.tutorialSubTabLinks = document.querySelectorAll("#tab-tutorial .tutorial-sub-tabs .sub-tab-link");
    this.tutorialSubTabContents = document.querySelectorAll("#tab-tutorial .sub-tab-content");
    this.loadCsvIngameButton = document.getElementById("load-csv-ingame");
    this.csvUploadIngameInput = document.getElementById("csv-upload-ingame");
    this.csvStatusIngame = document.getElementById("csv-status-ingame");
    this.themeSelectorIngame = document.getElementById("theme-ingame");
    this.confirmThemeChangeBtn = document.getElementById("confirm-theme-change-btn");
    this.applyThemeAndRestartBtn = document.getElementById("apply-theme-and-restart-btn");
    this.statsDisplayArea = document.getElementById("stats-display-area");
    this.loadLogoIngameButton = document.getElementById("load-logo-ingame");
    this.logoUploadIngameInput = document.getElementById("logo-upload-ingame");
    this.logoStatusIngame = document.getElementById("logo-status-ingame");
    this.toggleSoundIngameButton = document.getElementById("toggle-sound-ingame");
    this.darkModeToggle = document.getElementById("dark-mode-toggle");
    this.languageSelect = document.getElementById("language-select");
    this.floatingTimerContainer = document.getElementById("floating-timer-container");
    this.floatingTimerCountdownDisplay = document.getElementById("floating-timer-countdown");
    this.toastContainer = document.getElementById("toast-container");

    this.gameModeMenu.style.display = 'flex';
    this.gameState = "modeSelection";

    // --- Sons ---
    this.spinSound = document.getElementById("spin-sound");
    this.winSound = document.getElementById("win-sound");
    this.loseSound = document.getElementById("lose-sound");
    this.letterRevealSound = document.getElementById("letter-reveal-sound");
    this.blockRevealSound = document.getElementById("block-reveal-sound");
    this.revealSound = document.getElementById("reveal-sound");
    this.passSound = document.getElementById("pass-sound");
    this.loseAllSound = document.getElementById("lose-all-sound");
    this.passTurnSound = document.getElementById("pass-turn-sound");
    this.timerSound = document.getElementById("timer-sound");
    this.wordCompleteSound = document.getElementById("word-complete-sound");

    // --- Estado do Jogo ---
    this.userDatabase = [];
    this.currentTheme = null;
    this.currentWord = "";
    this.currentHint = "";
    this.gridMap = [];
    this.gridItems = [];
    this.alphabetLetters = {};
    this.numberOfPlayers = 3;
    this.currentPlayer = 1;
    this.nextStartingPlayer = 1;

    this.playerLetterScores = [];
    this.playerWordScores = [];

    this.scoreElements = [];
    this.scoreValueElements = [];
    this.currentPrize = 0;
    this.currentRotation = 0;
    this.isSpinning = false;
    this.soundEnabled = true;
    this.gameState = "loading";
    this.gameTitle = "Roda a Roda";
    this.customLogo = null;
    this.selectedGameMode = 'classic';
    this.wordPoints = 0;
    this.INITIAL_WORD_POINTS_QUICK_MODE = 2000;
    this.nextThemeIndex = -1;
    this.floatingTimerInterval = null;
    this.floatingTimerActive = false;
    this.FLOATING_TIMER_DURATION = 10;
    this.gameStats = {
        totalRoundsPlayed: 0,
        roundsByMode: { classic: 0, quick: 0, concept: 0 },
        highScores: { classic: 0, quick: 0, concept: 0 },
        fastestReveal: { time: Infinity, word: '', theme: '' },
    };
    this.wordStartTime = 0;

    this.WHEEL_SECTIONS = [
        { startAngle: 0, endAngle: 15, value: 1000, type: "money", text: "R$1000" },
        { startAngle: 15, endAngle: 30, value: 150, type: "money", text: "R$150" },
        { startAngle: 30, endAngle: 45, value: 400, type: "money", text: "R$400" },
        { startAngle: 45, endAngle: 60, value: 650, type: "money", text: "R$650" },
        { startAngle: 60, endAngle: 75, value: 300, type: "money", text: "R$300" },
        { startAngle: 75, endAngle: 90, value: "passou", type: "pass", text: "Passou a Vez" },
        { startAngle: 90, endAngle: 105, value: 550, type: "money", text: "R$550" },
        { startAngle: 105, endAngle: 120, value: 900, type: "money", text: "R$900" },
        { startAngle: 120, endAngle: 135, value: 450, type: "money", text: "R$450" },
        { startAngle: 135, endAngle: 150, value: 100, type: "money", text: "R$100" },
        { startAngle: 150, endAngle: 165, value: 750, type: "money", text: "R$750" },
        { startAngle: 165, endAngle: 180, value: "passou", type: "pass", text: "Passou a Vez" },
        { startAngle: 180, endAngle: 195, value: 950, type: "money", text: "R$950" },
        { startAngle: 195, endAngle: 210, value: 200, type: "money", text: "R$200" },
        { startAngle: 210, endAngle: 225, value: 350, type: "money", text: "R$350" },
        { startAngle: 225, endAngle: 240, value: 700, type: "money", text: "R$700" },
        { startAngle: 240, endAngle: 255, value: 250, type: "money", text: "R$250" },
        { startAngle: 255, endAngle: 270, value: "passou", type: "pass", text: "Passou a Vez" },
        { startAngle: 270, endAngle: 285, value: 600, type: "money", text: "R$600" },
        { startAngle: 285, endAngle: 300, value: 850, type: "money", text: "R$850" },
        { startAngle: 300, endAngle: 315, value: 500, type: "money", text: "R$500" },
        { startAngle: 315, endAngle: 330, value: 50, type: "money", text: "R$050" },
        { startAngle: 330, endAngle: 345, value: 800, type: "money", text: "R$800" },
        { startAngle: 345, endAngle: 360, value: 0, type: "lose", text: "Perdeu Tudo" }
      ];
    this.init();
  }

  init() {
    this.loadStats();
    
    this.setupModeSelection();
    this.setupInitialConfig();
    this.setupInGameConfig();
    this.initGameAreaEvents();
    this.initializeGrid();
    this.mapAlphabetLetters();
    this.updateStatusIndicator();
    this.setupFloatingTimer();
    this.setupConfigTabs();
    this.setupGameSettingsControls();
    this.checkDarkModePreference();
    this.updateSoundToggleButtons();
  }

  

  setupModeSelection() {
    this.modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled && button.getAttribute('data-mode') !== 'quick') return;
        if (button.getAttribute('data-mode') === 'concept' && button.disabled) return;

        this.selectedGameMode = button.getAttribute('data-mode');
        console.log("Modo de Jogo Selecionado:", this.selectedGameMode);
        this.gameModeMenu.style.display = 'none';
        const modeName = button.textContent.replace(' (Em Breve)', '');
        this.initialConfigTitle.textContent = `Configurar Jogo: ${modeName}`;
        this.initialConfigModal.style.display = 'flex';
        this.gameState = "configuring";
        this.updateStatusIndicator();
      });
    });
  }

  setupInitialConfig() {
    this.loadCsvInitialButton.addEventListener('click', () => {
        this.csvUploadInitialInput.click();
    });
    this.csvUploadInitialInput.addEventListener('change', (event) => this.handleFileUpload(event, 'initial', true));
    this.startGameBtn.addEventListener('click', () => {
        if (this.validateInitialConfig()) {
            this.gameTitle = this.gameTitleInput.value || "Roda a Roda";
            this.numberOfPlayers = parseInt(this.playerCountSelector.value, 10);
            const selectedThemeIndex = parseInt(this.themeSelectorInitial.value, 10);
            if (isNaN(selectedThemeIndex) || selectedThemeIndex < 0 || selectedThemeIndex >= this.userDatabase.length) {
                this.showToast("Erro: Tema inválido selecionado.", "error");
                return;
            }
            this.currentTheme = this.userDatabase[selectedThemeIndex];
            this.nextThemeIndex = -1;
            this.tituloRoleta.textContent = this.gameTitle;
            this.initialConfigModal.style.display = 'none';
            this.gameArea.style.display = 'flex';
            this.initGameStructures();
            this.resetAndStartNewRound();
        }
    });
    this.themeSelectorInitial.addEventListener('change', this.checkInitialConfigReady.bind(this));
    this.checkInitialConfigReady();
  }

  validateInitialConfig() {
    if (this.userDatabase.length === 0) {
        this.showToast("Carregue uma planilha CSV válida primeiro.", "error");
        return false;
    }
    if (this.themeSelectorInitial.value === "" || this.themeSelectorInitial.value === null) {
        this.showToast("Selecione um tema para iniciar.", "error");
        return false;
    }
    return true;
  }

  checkInitialConfigReady() {
    this.startGameBtn.disabled = !(this.userDatabase.length > 0 && this.themeSelectorInitial.value !== "" && this.themeSelectorInitial.value !== null);
    this.startGameBtn.setAttribute('aria-disabled', String(this.startGameBtn.disabled));
  }

  initGameStructures() {
    this.scoreboardContainer.innerHTML = '';
    this.playerLetterScores = [];
    this.playerWordScores = [];
    this.scoreElements = [];
    this.scoreValueElements = [];
    for (let i = 1; i <= this.numberOfPlayers; i++) {
      this.playerLetterScores.push(0);
      this.playerWordScores.push(0);
      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'score';
      scoreDiv.id = `score-${i}`;
      scoreDiv.textContent = `Jogador ${i}`;
      const scoreValueDiv = document.createElement('div');
      scoreValueDiv.className = 'score-value';
      scoreValueDiv.textContent = 'R$0';
      scoreDiv.appendChild(scoreValueDiv);
      this.scoreboardContainer.appendChild(scoreDiv);
      this.scoreElements.push(scoreDiv);
      this.scoreValueElements.push(scoreValueDiv);
    }
    this.updateScores();
  }

  initializeGrid() {
    this.gridContainer.innerHTML = '';
    this.gridItems = [];
    for (let i = 0; i < 36; i++) {
      const gridItem = document.createElement('div');
      gridItem.className = 'grid-item';
      this.gridContainer.appendChild(gridItem);
      this.gridItems.push(gridItem);
    }
  }

  mapAlphabetLetters() {
    this.alphabetLetters = {};
    const letters = this.alphabetContainer.querySelectorAll('.alphabet-letter');
    letters.forEach(letterEl => {
        const letter = letterEl.getAttribute('data-letter');
        if (letter) {
            this.alphabetLetters[this.normalizeLetter(letter)] = letterEl;
        }
    });
  }

  initGameAreaEvents() {
    this.alphabetContainer.addEventListener("click", (event) => {
      const letterButton = event.target.closest('.alphabet-letter');
      if (letterButton) {
        const letter = letterButton.getAttribute("data-letter");
        if (!letterButton.classList.contains("disabled") && !letterButton.disabled) {
             this.checkLetter(letter);
        }
      }
    });
    this.spinButton.addEventListener("click", () => this.spinWheel());
    this.logoSpace.addEventListener("click", () => this.spinWheel());
    this.soundToggle.addEventListener("click", () => {
      this.soundEnabled = !this.soundEnabled;
      this.updateSoundToggleButtons();
      this.showToast(`Som ${this.soundEnabled ? 'ativado' : 'desativado'}`, 'info');
    });

    this.revealButton.addEventListener("click", () => {
        if (this.revealButton.disabled || this.isSpinning) return;
        this.playerAttemptsToSolve();
    });

    this.passButton.addEventListener("click", () => {
       if (this.passButton.disabled || this.isSpinning) return;
       this.handlePassTurnAction();
    });
    if(this.timerButton) {
          this.timerButton.addEventListener("click", () => this.startFloatingTimer());
    }
  }

  setupInGameConfig() {
     this.ingameConfigButton.addEventListener('click', () => {
         if (this.gameState === 'login' || this.gameState === 'modeSelection' || this.gameState === 'configuring') {
             this.showToast("Acesse as configurações após iniciar o jogo.", "info");
             return;
         }
         this.updateThemeSelector(this.themeSelectorIngame, false);
         this.displayStats();
         this.ingameConfigModal.style.display = 'flex';
         this.activateTab(this.configTabLinks, this.configTabContents, this.configTabLinks[0], this.configTabLinks[0].getAttribute("data-tab"));
         if (this.tutorialSubTabLinks.length > 0) {
            const quickTutorialButton = document.getElementById('tutorial-quick-button');
            if (quickTutorialButton) {
                quickTutorialButton.disabled = false;
                quickTutorialButton.removeAttribute('aria-disabled');
            }
            this.activateTab(this.tutorialSubTabLinks, this.tutorialSubTabContents, this.tutorialSubTabLinks[0], this.tutorialSubTabLinks[0].getAttribute("data-subtab"));
         }
     });
     this.closeIngameConfigModalButton.addEventListener('click', () => {
         this.ingameConfigModal.style.display = 'none';
     });
     this.loadCsvIngameButton.addEventListener('click', () => {
         this.csvUploadIngameInput.click();
     });
     this.csvUploadIngameInput.addEventListener('change', (event) => this.handleFileUpload(event, 'ingame', true));
     this.themeSelectorIngame.addEventListener('change', () => {
        const isSelectionValid = this.themeSelectorIngame.value !== "" && this.userDatabase.length > 0;
        if (this.confirmThemeChangeBtn) {
            this.confirmThemeChangeBtn.disabled = !isSelectionValid;
            this.confirmThemeChangeBtn.setAttribute('aria-disabled', String(!isSelectionValid));
        }
        if (this.applyThemeAndRestartBtn) {
            this.applyThemeAndRestartBtn.disabled = !isSelectionValid;
            this.applyThemeAndRestartBtn.setAttribute('aria-disabled', String(!isSelectionValid));
        }
     });
     if (this.confirmThemeChangeBtn) {
        this.confirmThemeChangeBtn.addEventListener('click', () => {
            const selectedIndex = parseInt(this.themeSelectorIngame.value, 10);
            if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < this.userDatabase.length) {
                this.nextThemeIndex = selectedIndex;
                this.showToast(`Tema "${this.userDatabase[selectedIndex].theme}" (da planilha atual) confirmado para a próxima rodada.`, "success");
            } else {
                this.showToast("Nenhum tema válido selecionado para confirmar para a próxima rodada.", "warning");
                this.nextThemeIndex = -1;
            }
        });
     }
     if (this.applyThemeAndRestartBtn) {
        this.applyThemeAndRestartBtn.addEventListener('click', () => {
            const selectedIndex = parseInt(this.themeSelectorIngame.value, 10);
            if (this.userDatabase.length === 0) {
                this.showToast("Nenhuma planilha carregada. Carregue uma primeiro.", "error"); return;
            }
            if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= this.userDatabase.length) {
                this.showToast("Por favor, selecione um tema válido.", "error"); return;
            }
            this.currentTheme = this.userDatabase[selectedIndex];
            this.currentTheme.words.forEach(w => w.used = false);
            this.nextThemeIndex = -1;
            this.showToast(`Tema "${this.currentTheme.theme}" carregado e lista de palavras reiniciada.`, "success", 3000);
            if (this.ingameConfigModal) this.ingameConfigModal.style.display = 'none';
            for (let i = 0; i < this.numberOfPlayers; i++) {
                this.playerLetterScores[i] = 0;
                this.playerWordScores[i] = 0;
            }
            this.updateScores();
            setTimeout(() => this.resetAndStartNewRound(), 500);
        });
    }
  }

  clearGrid() {
      this.gridMap = Array(36).fill(null);
      this.gridItems.forEach(item => {
          item.textContent = "";
          item.className = 'grid-item';
          item.style.backgroundColor = '';
          item.style.color = '';
      });
  }

  resetAndStartNewRound() {
      this.clearGrid();
      setTimeout(() => {
          this.startGame();
      }, 100);
  }

  startGame() {
    console.log("Iniciando nova rodada no modo:", this.selectedGameMode);
    this.clearCountdownTimer();
    this.stopFloatingTimer();
    this.isSpinning = false;
    this.spinButton.disabled = false;
    this.logoSpace.style.cursor = 'pointer';
    this.passButton.disabled = false;
    this.passButton.setAttribute('aria-disabled', 'false');
    if (this.timerButton) this.timerButton.disabled = false;
    if (this.ingameConfigButton) this.ingameConfigButton.disabled = false;

    if (this.nextThemeIndex !== -1 && this.userDatabase[this.nextThemeIndex]) {
        this.currentTheme = this.userDatabase[this.nextThemeIndex];
        this.showToast(`Iniciando rodada com o tema: ${this.currentTheme.theme}`, "info");
        this.nextThemeIndex = -1;
        if (this.themeSelectorIngame) {
            const currentInDbIndex = this.userDatabase.findIndex(t => t.theme === this.currentTheme.theme);
            if (currentInDbIndex !== -1) this.themeSelectorIngame.value = currentInDbIndex;
            const isSelectionValid = this.themeSelectorIngame.value !== "" && this.userDatabase.length > 0;
            if (this.confirmThemeChangeBtn) { this.confirmThemeChangeBtn.disabled = !isSelectionValid; this.confirmThemeChangeBtn.setAttribute('aria-disabled', String(!isSelectionValid)); }
            if (this.applyThemeAndRestartBtn) { this.applyThemeAndRestartBtn.disabled = !isSelectionValid; this.applyThemeAndRestartBtn.setAttribute('aria-disabled', String(!isSelectionValid)); }
        }
    } else if (!this.currentTheme) {
        if (this.userDatabase.length > 0) {
            this.currentTheme = this.userDatabase[0];
            this.showToast(`Usando tema padrão: ${this.currentTheme.theme}`, "info");
            if (this.themeSelectorInitial) this.themeSelectorInitial.value = "0";
            if (this.themeSelectorIngame) {
                 this.themeSelectorIngame.value = "0";
                 const isSelectionValid = this.themeSelectorIngame.value !== "" && this.userDatabase.length > 0;
                 if (this.confirmThemeChangeBtn) { this.confirmThemeChangeBtn.disabled = !isSelectionValid; this.confirmThemeChangeBtn.setAttribute('aria-disabled', String(!isSelectionValid)); }
                 if (this.applyThemeAndRestartBtn) { this.applyThemeAndRestartBtn.disabled = !isSelectionValid; this.applyThemeAndRestartBtn.setAttribute('aria-disabled', String(!isSelectionValid)); }
            }
        } else {
            this.showToast("Erro fatal: Nenhuma planilha carregada. Configure o jogo.", "error");
            this.gameState = 'configuring'; this.updateStatusIndicator();
            this.initialConfigModal.style.display = 'flex'; this.gameArea.style.display = 'none';
            return;
        }
    }
    if (!this.currentTheme || !this.currentTheme.words || this.currentTheme.words.length === 0) {
         this.showToast(`Erro: O tema "${this.currentTheme ? this.currentTheme.theme : 'Desconhecido'}" não possui palavras válidas.`, "error");
         this.gameState = 'configuring'; this.updateStatusIndicator();
         this.initialConfigModal.style.display = 'flex'; this.gameArea.style.display = 'none';
         return;
    }

    let unusedWords = this.currentTheme.words.filter(w => !w.used);

    if (unusedWords.length === 0) {
        this.showToast(`Todas as palavras do tema "${this.currentTheme.theme}" foram usadas. Reiniciando lista!`, "info", 5000);
        this.currentTheme.words.forEach(w => w.used = false);
        unusedWords = this.currentTheme.words;
    }
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    const randomWordData = unusedWords[randomIndex];

    randomWordData.used = true;

    this.currentWord = randomWordData.word.toUpperCase();
    this.currentHint = randomWordData.hint;

    if (this.selectedGameMode === 'quick') {
      this.wordPoints = this.INITIAL_WORD_POINTS_QUICK_MODE;
      console.log(`Modo Resposta Rápida: Palavra '${this.currentWord}' valendo ${this.wordPoints} pontos.`);
    } else {
      this.wordPoints = 0;
    }
    this.updateWordPointsDisplay();
    this.updateHintDisplay(this.currentHint);
    this.initializeWordGrid();
    this.gridItems.forEach(item => item.classList.remove('revealed_in_sequence'));
    this.resetAlphabet();
    this.currentPlayer = this.nextStartingPlayer;
    this.nextStartingPlayer = (this.currentPlayer % this.numberOfPlayers) + 1;
    this.setActivePlayer(this.currentPlayer);
    this.gameState = "spinningWheel";
    this.updateStatusIndicator();
    this.updateScores();
    this.updateRevealButtonState();
    this.wordStartTime = performance.now();
  }

  updateWordPointsDisplay() {
    if (this.wordPointsDisplay) {
      if (this.selectedGameMode === 'quick') {
        this.wordPointsDisplay.textContent = `Palavra Valendo: R$${this.wordPoints}`;
        this.wordPointsDisplay.style.display = 'block';
      } else {
        this.wordPointsDisplay.style.display = 'none';
      }
    }
  }

  calculateAndUpdateWordPointsQuickMode() {
    if (this.selectedGameMode !== 'quick' || !this.currentWord) {
        if (this.wordPointsDisplay) this.wordPointsDisplay.style.display = 'none';
        return;
    }
    const { revealedLetterCount, totalLettersInWord } = this.getWordRevealStats();
    if (totalLettersInWord === 0) { this.wordPoints = 0; this.updateWordPointsDisplay(); return; }

    const percentageRevealed = (revealedLetterCount / totalLettersInWord) * 100;
    let newTargetPoints = this.INITIAL_WORD_POINTS_QUICK_MODE;
    if (percentageRevealed >= 70) newTargetPoints = 300;
    else if (percentageRevealed >= 50) newTargetPoints = 800;
    else if (percentageRevealed >= 30) newTargetPoints = 1200;

    if (newTargetPoints < this.wordPoints || (this.wordPoints === this.INITIAL_WORD_POINTS_QUICK_MODE && newTargetPoints < this.INITIAL_WORD_POINTS_QUICK_MODE) ) {
        this.wordPoints = newTargetPoints;
    }
    console.log(`Modo Resposta Rápida: ${revealedLetterCount}/${totalLettersInWord} letras (${percentageRevealed.toFixed(1)}%) reveladas. Pontos da palavra: R$${this.wordPoints}`);
    this.updateWordPointsDisplay();
  }

  updateHintDisplay(hint) {
      const hintSpan = this.hintText; hintSpan.innerHTML = ''; if (!hint) return;
      const gridItemWidth = 78, gridGap = 7, gridColumns = 12;
      const calculatedMaxWidth = (gridColumns * gridItemWidth) + ((gridColumns - 1) * gridGap);
      const words = hint.split(/(\s+)/); let lines = []; let currentLine = '';
      const tempSpan = document.createElement('span');
      try {
          const hintContainerStyle = window.getComputedStyle(hintSpan.parentNode);
          Object.assign(tempSpan.style, { fontFamily: hintContainerStyle.fontFamily, fontSize: hintContainerStyle.fontSize, fontWeight: hintContainerStyle.fontWeight, letterSpacing: hintContainerStyle.letterSpacing });
      } catch (e) { Object.assign(tempSpan.style, { fontFamily: 'Arial, sans-serif', fontSize: '22px' }); }
      Object.assign(tempSpan.style, { visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' });
      document.body.appendChild(tempSpan); let wordBuffer = '';
      words.forEach(part => {
          if (part.trim() === '') wordBuffer += part;
          else {
              const word = part; const potentialLine = currentLine + wordBuffer + word;
              tempSpan.textContent = potentialLine;
              if (tempSpan.offsetWidth <= calculatedMaxWidth) currentLine += wordBuffer + word;
              else {
                  if (currentLine.trim()) lines.push(currentLine.trim());
                  currentLine = (wordBuffer + word).trimStart();
                  tempSpan.textContent = word;
              }
              wordBuffer = '';
          }
      });
      if (currentLine.trim()) lines.push(currentLine.trim());
      if (tempSpan.parentNode === document.body) document.body.removeChild(tempSpan);
      const originalLineCount = lines.length; lines = lines.slice(0, 3);
      let finalHtml = lines.join('<br>'); if (originalLineCount > 3) finalHtml += '...';
      hintSpan.innerHTML = finalHtml;
  }

  // --- FUNÇÃO MODIFICADA ---
  initializeWordGrid() {
    const gridColumns = 12;
    const words = this.currentWord.split(' ');

    let lineIndexes;
    if (words.length === 1) {
        lineIndexes = [1];
    } else if (words.length === 2) {
        lineIndexes = [0, 1];
    } else {
        lineIndexes = [0, 1, 2];
    }

    words.forEach((word, wordIndex) => {
        if (wordIndex >= lineIndexes.length) return;

        const currentRow = lineIndexes[wordIndex];
        const startCol = Math.floor((gridColumns - word.length) / 2);

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const gridIndex = (currentRow * gridColumns) + startCol + i;

            if (this.gridItems[gridIndex]) {
                const gridItem = this.gridItems[gridIndex];
                
                if (char === "-") {
                    gridItem.textContent = "-";
                    gridItem.classList.add("revealed"); 
                    gridItem.style.backgroundColor = 'white';
                    gridItem.style.color = 'black';
                    this.gridMap[gridIndex] = null;
                } else if (char === " ") {
                    gridItem.classList.add("space");
                    this.gridMap[gridIndex] = null;
                } else {
                    this.gridMap[gridIndex] = { char: char, originalIndex: i };
                    gridItem.classList.add("empty");
                }
            }
        }
    });
  }

  resetAlphabet() { Object.values(this.alphabetLetters).forEach(el => { el.classList.remove("disabled"); el.style.opacity = '1'; if (el.tagName === 'BUTTON') { el.disabled = false; el.removeAttribute('aria-disabled'); }}); }

  spinWheel() {
      if (this.isSpinning || this.gameState !== "spinningWheel") return;
      this.isSpinning = true;
      this.spinButton.disabled = true; this.logoSpace.style.cursor = 'default';
      this.passButton.disabled = true; this.passButton.setAttribute('aria-disabled', 'true');
      this.revealButton.disabled = true; this.revealButton.setAttribute('aria-disabled', 'true');
      if(this.timerButton) this.timerButton.disabled = true;
      this.clearCountdownTimer(); this.stopFloatingTimer(); this.playSound(this.spinSound);
      const randomAngle = Math.random() * 360, extraRotations = 5 * 360;
      this.currentRotation += extraRotations + randomAngle;
      this.roleta.style.transition = 'transform 6s cubic-bezier(0.17, 0.67, 0.21, 0.99)';
      this.roleta.style.transform = `rotate(${this.currentRotation}deg)`;
      setTimeout(() => {
        if (this.spinSound) { this.spinSound.pause(); this.spinSound.currentTime = 0; }
        const section = this.getSelectedSection(this.currentRotation % 360);
        if (!section) { this.showToast("Erro na roleta.", "error"); this.resetSpinState(); return; }
        this.handleWheelResult(section);
      }, 6000);
  }

  getSelectedSection(finalRotation) {
      const pointerOffsetAngle = 90;
      const normalizedAngle = (360 - (finalRotation % 360) + pointerOffsetAngle) % 360;
      for (const section of this.WHEEL_SECTIONS) if (normalizedAngle >= section.startAngle && normalizedAngle < section.endAngle) return section;
      if (normalizedAngle === 0 || normalizedAngle === 360) { const last = this.WHEEL_SECTIONS.at(-1); if (last.endAngle === 360) return last; }
      console.warn("Seção da roleta não encontrada para o ângulo normalizado:", normalizedAngle, "Ângulo final da roleta:", finalRotation); return this.WHEEL_SECTIONS[0];
  }

  handleWheelResult(section) {
      this.currentPrize = 0;
      switch (section.type) {
          case 'money':
              this.currentPrize = parseInt(section.value);
              this.showToast(`Jogador ${this.currentPlayer} parou em: ${section.text}!`, "success");
              this.gameState = "choosingLetter";
              break;
          case 'pass':
              this.showToast(`Jogador ${this.currentPlayer} ${section.text}!`, "pass");
              this.playSound(this.passTurnSound);
              this.advancePlayer();
              this.gameState = "spinningWheel";
              break;
          case 'lose':
              this.playSound(this.loseAllSound);

              if (this.selectedGameMode !== 'quick') {
                  const totalScoreLostClassic = this.playerLetterScores[this.currentPlayer - 1] + this.playerWordScores[this.currentPlayer - 1];
                  this.showToast(`Jogador ${this.currentPlayer} Perdeu Tudo! Perdeu R$${totalScoreLostClassic}.`, "loseall", 3000);
                  this.playerLetterScores[this.currentPlayer - 1] = 0;
                  this.playerWordScores[this.currentPlayer - 1] = 0;
                  this.updateScores();
                  console.log(`Modo Clássico: Jogador ${this.currentPlayer} perdeu tudo.`);
              } else {
                  const letterScoreLostThisTurn = this.playerLetterScores[this.currentPlayer - 1];
                  if (letterScoreLostThisTurn > 0) {
                      this.playerLetterScores[this.currentPlayer - 1] = 0;
                      this.updateScores();
                      this.showToast(`Jogador ${this.currentPlayer} Perdeu Tudo! Perdeu R$${letterScoreLostThisTurn} de pontos de letras. Pontos de palavra mantidos.`, "loseall", 4000);
                      console.log(`Modo Rápido: Jogador ${this.currentPlayer} perdeu R$${letterScoreLostThisTurn} (pontos de letras). playerLetterScores agora é 0.`);
                  } else {
                      this.showToast(`Jogador ${this.currentPlayer} Perdeu Tudo! Não havia pontos de letras para perder nesta rodada.`, "loseall", 3000);
                      console.log(`Modo Rápido: Jogador ${this.currentPlayer} caiu em Perdeu Tudo, mas não havia pontos de letras para perder.`);
                  }
              }
              this.advancePlayer();
              this.gameState = "spinningWheel";
              break;
          default:
              this.showToast("Erro na roleta.", "error");
              this.gameState = "spinningWheel";
              break;
      }
      this.resetSpinState();
      this.updateStatusIndicator();
  }

  resetSpinState() {
      setTimeout(() => {
          this.isSpinning = false;
          const isChoosing = this.gameState === 'choosingLetter';
          const isSpinningWheel = this.gameState === 'spinningWheel';
          this.spinButton.disabled = isChoosing || !isSpinningWheel;
          this.logoSpace.style.cursor = isChoosing || !isSpinningWheel ? 'default' : 'pointer';
          this.passButton.disabled = !(isChoosing || isSpinningWheel);
          this.passButton.setAttribute('aria-disabled', String(this.passButton.disabled));
          this.updateRevealButtonState();
          if (this.timerButton) this.timerButton.disabled = this.isSpinning;
      }, 100);
  }

  checkLetter(letter) {
    if (this.isSpinning || this.gameState !== "choosingLetter") return;
    const normalizedClickedLetter = this.normalizeLetter(letter);
    const letterElement = this.alphabetLetters[normalizedClickedLetter];
    if (!letterElement || letterElement.classList.contains("disabled")) return;
    letterElement.classList.add("disabled"); if (letterElement.tagName === 'BUTTON') letterElement.disabled = true;
    letterElement.setAttribute('aria-disabled', 'true'); letterElement.style.opacity = '0.6';

    let letterFound = false;
    const matchingPositions = [];

    this.gridMap.forEach((mapItem, gridIndex) => {
        if (mapItem && this.normalizeLetter(mapItem.char) === normalizedClickedLetter) {
            const gridItem = this.gridItems[gridIndex];
            if (gridItem && !gridItem.classList.contains('revealed')) {
                matchingPositions.push(gridIndex);
                letterFound = true;
            }
        }
    });

    if (letterFound) {
        this.showToast(`Letra '${letter}' encontrada!`, "success");
        this.passButton.disabled = true; this.passButton.setAttribute('aria-disabled', 'true');
        this.revealButton.disabled = true; this.revealButton.setAttribute('aria-disabled', 'true');
        this.gridItems.forEach(item => item.classList.remove('revealed_in_sequence'));
        
        this.revealLettersSequentially(matchingPositions);

    } else {
        this.showToast(`Letra '${letter}' não encontrada.`, "warning"); this.playSound(this.loseSound);
        this.advancePlayer(); this.gameState = "spinningWheel";
        this.resetSpinState();
        this.updateStatusIndicator();
    }
  }

  revealLettersSequentially(positions) {
      if (positions.length === 0) {
          if (this.selectedGameMode === 'quick') this.calculateAndUpdateWordPointsQuickMode();
          if (this.checkWin()) {
              this.handleWin();
          } else {
               this.gameState = "spinningWheel";
               this.resetSpinState();
               this.passButton.disabled = false;
               this.passButton.setAttribute('aria-disabled', 'false');
               this.updateStatusIndicator();
          }
          return;
      }
      const gridIndex = positions.shift();
      const gridItem = this.gridItems[gridIndex];
      const charToReveal = this.gridMap[gridIndex] ? this.gridMap[gridIndex].char : '';

      if (!gridItem) { console.error("Grid item não encontrado:", gridIndex); this.revealLettersSequentially(positions); return; }
      
      gridItem.classList.remove("empty"); gridItem.classList.add("revealing");
      
      setTimeout(() => {
          this.playSound(this.letterRevealSound); 
          gridItem.textContent = charToReveal;
          if (this.currentPrize > 0) {
              const pointsGainedThisLetter = this.currentPrize;
              this.playerLetterScores[this.currentPlayer - 1] += pointsGainedThisLetter;
              this.updateScores();
          }
      }, 250);

      setTimeout(() => {
          gridItem.classList.remove("revealing"); 
          gridItem.classList.add("revealed");
          gridItem.style.backgroundColor = 'white'; 
          gridItem.style.color = 'black';
          this.revealLettersSequentially(positions);
      }, 500);
  }

  checkWin() {
    for (let i = 0; i < this.gridMap.length; i++) {
        const mapItem = this.gridMap[i];
        if (mapItem && mapItem.char !== " ") {
            const gridItem = this.gridItems[i];
            if (!gridItem || !gridItem.classList.contains('revealed')) {
                return false;
            }
        }
    }
    return this.gridMap.some(item => item !== null && item.char !== " ");
  }

  playerAttemptsToSolve() {
    console.log(`Jogador ${this.currentPlayer} clicou em Resolver Palavra.`);
    this.playSound(this.blockRevealSound);
    this.disableAllActions(); this.disableAlphabet();

    if (this.selectedGameMode === 'quick') {
        this.playerWordScores[this.currentPlayer - 1] += this.wordPoints;
        this.showToast(`Você resolveu e ganhou R$${this.wordPoints} da palavra!`, "success", 4000);
        console.log(`Resposta Rápida (playerSolves): Jogador ${this.currentPlayer} +R$${this.wordPoints} (pontos de palavra). playerWordScores: ${this.playerWordScores[this.currentPlayer - 1]}`);
    } else {
        this.showToast("Palavra revelada!", "info", 4000);
    }
    this.updateScores();

    let delay = 0; let lettersAnimatedNow = 0; let hasAnimatedSomething = false;
    this.gridMap.forEach((mapItem, gridIndex) => {
        if (mapItem && mapItem.char !== " ") {
            const gridItem = this.gridItems[gridIndex];
            if (gridItem && !gridItem.classList.contains('revealed')) {
                lettersAnimatedNow++; hasAnimatedSomething = true;
                setTimeout(() => {
                    gridItem.classList.remove("empty"); gridItem.classList.add("revealing");
                    setTimeout(() => { gridItem.textContent = mapItem.char; }, 125);
                    setTimeout(() => {
                        gridItem.classList.remove("revealing"); gridItem.classList.add("revealed");
                        gridItem.style.backgroundColor = 'white'; gridItem.style.color = 'black';
                        if (--lettersAnimatedNow === 0) this.finalizeRoundWin(true);
                    }, 250);
                }, delay);
                delay += 30;
            }
        }
    });
    if (!hasAnimatedSomething) this.finalizeRoundWin(true);
  }

  handleWin() {
    console.log("Palavra completada letra a letra (handleWin).");
    if (this.selectedGameMode === 'quick') {
        this.playerWordScores[this.currentPlayer - 1] += this.wordPoints;
        this.showToast(`Palavra completa! Você ganhou R$${this.wordPoints} adicionais (pontos de palavra)!`, "success", 4000);
        console.log(`Resposta Rápida (handleWin): Jogador ${this.currentPlayer} +R$${this.wordPoints} (pontos de palavra). playerWordScores: ${this.playerWordScores[this.currentPlayer - 1]}`);
    }
    this.updateScores();
    this.finalizeRoundWin(false);
  }

  finalizeRoundWin(solvedByPlayerAction) {
    this.gameState = "gameOver";
    this.updateStatusIndicator();

    this.playSound(this.wordCompleteSound);

    const elapsedTime = (performance.now() - this.wordStartTime) / 1000;
    this.updateStats('roundFinished');
    this.updateStats('wordRevealed', { time: elapsedTime, word: this.currentWord, theme: this.currentTheme?.theme || 'Desconhecido' });

    const winner = this.currentPlayer;
    const finalLetterScore = this.playerLetterScores[winner - 1];
    const finalWordScore = this.playerWordScores[winner - 1];
    const finalTotalScoreForRound = finalLetterScore + finalWordScore;

    const currentHighScore = this.gameStats.highScores[this.selectedGameMode] || 0;
    if (finalTotalScoreForRound > currentHighScore) {
        this.updateStats('highScore', finalTotalScoreForRound);
        this.showToast(`Novo recorde para ${this.selectedGameMode}: R$${finalTotalScoreForRound}!`, "success");
    }
    this.highlightWord();
    const messageType = solvedByPlayerAction && this.selectedGameMode === 'quick' ? "success" : "info";
    this.showToast(`Jogador ${winner} venceu a rodada! Palavra: "${this.currentWord}". Pontuação Final: R$${finalTotalScoreForRound}`, messageType, 7000);
    this.disableAllActions();

    if (this.selectedGameMode === 'quick') {
        this.wordPoints = 0; this.updateWordPointsDisplay();
    }
    this.gridItems.forEach(item => item.classList.remove('revealed_in_sequence'));
    setTimeout(() => this.resetAndStartNewRound(), 7000);
  }
  
  highlightWord() { 
    this.gridMap.forEach((mapItem, gridIndex) => {
        if (mapItem && mapItem.char !== " ") {
            const el = this.gridItems[gridIndex];
            if (el) el.classList.add("highlight");
        }
    });
  }

  revealAllLetters() {
      this.disableAllActions(); this.disableAlphabet();
      let delay = 0, lettersToRevealCount = 0;
      let wordPointsLostMessage = "";
      if (this.selectedGameMode === 'quick' && this.wordPoints > 0) {
          console.log(`Resposta Rápida (SISTEMA REVELA): ${this.wordPoints} pontos da palavra perdidos.`);
          wordPointsLostMessage = ` Os R$${this.wordPoints} da palavra foram perdidos.`;
          this.wordPoints = 0; this.updateWordPointsDisplay();
      }
      
      this.gridMap.forEach((mapItem, gridIndex) => {
          if (mapItem && mapItem.char !== " ") {
              const gridItem = this.gridItems[gridIndex];
              if (gridItem && !gridItem.classList.contains('revealed')) {
                  lettersToRevealCount++;
                  setTimeout(() => {
                      gridItem.classList.remove("empty"); gridItem.classList.add("revealing");
                      setTimeout(() => { gridItem.textContent = mapItem.char; }, 125);
                      setTimeout(() => {
                          gridItem.classList.remove("revealing"); gridItem.classList.add("revealed");
                          gridItem.style.backgroundColor = 'white'; gridItem.style.color = 'black';
                           if (--lettersToRevealCount === 0) {
                                this.showToast(`Palavra revelada pelo sistema!${wordPointsLostMessage} Próxima rodada...`, "info", 5000);
                                this.updateStats('roundFinished', { revealed: true, bySystem: true });
                                this.gridItems.forEach(item => item.classList.remove('revealed_in_sequence'));
                                setTimeout(() => this.resetAndStartNewRound(), 5000);
                           }
                      }, 250);
                  }, delay);
                  delay += 30;
              }
          }
      });
       if (lettersToRevealCount === 0 && !this.checkWin()) {
            this.showToast(`Palavra revelada pelo sistema!${wordPointsLostMessage} Próxima rodada...`, "info", 5000);
            this.updateStats('roundFinished', { revealed: true, bySystem: true });
            this.gridItems.forEach(item => item.classList.remove('revealed_in_sequence'));
            setTimeout(() => this.resetAndStartNewRound(), 5000);
       } else if (lettersToRevealCount === 0 && this.checkWin()) {
            setTimeout(() => this.resetAndStartNewRound(), 100);
       }
  }

  handlePassTurnAction() {
    if (this.isSpinning || (this.gameState !== 'choosingLetter' && this.gameState !== 'spinningWheel')) return;
    this.showToast(`Jogador ${this.currentPlayer} passou a vez!`, "pass"); this.playSound(this.passSound);
    this.clearCountdownTimer(); this.stopFloatingTimer();
    this.advancePlayer();
    this.gameState = "spinningWheel"; this.resetSpinState();
    this.updateStatusIndicator();
  }

  advancePlayer() {
      this.currentPlayer = (this.currentPlayer % this.numberOfPlayers) + 1;
      this.setActivePlayer(this.currentPlayer);
  }

  setActivePlayer(player) { this.scoreElements.forEach((el, i) => el.classList.toggle("active", i + 1 === player)); }

  updateScores() {
    this.scoreValueElements.forEach((el, i) => {
        if (i < this.playerLetterScores.length && i < this.playerWordScores.length) {
            const totalPlayerScore = this.playerLetterScores[i] + this.playerWordScores[i];
            el.textContent = `R$${totalPlayerScore}`;
        } else if (i < this.scoreValueElements.length) {
            el.textContent = `R$0`;
        }
    });
  }

  updateStatusIndicator() { this.statusIndicator.setAttribute("data-state", this.gameState); }

  updateRevealButtonState() {
    if (this.isSpinning ||
        this.gameState === 'gameOver' ||
        this.gameState === 'login' ||
        this.gameState === 'modeSelection' ||
        this.gameState === 'configuring') {
        this.revealButton.disabled = true;
        this.revealButton.setAttribute('aria-disabled', 'true');
        return;
    }
    if (this.checkWin()) {
        this.revealButton.disabled = true;
        this.revealButton.setAttribute('aria-disabled', 'true');
        return;
    }
    if (this.selectedGameMode === 'quick') {
        this.revealButton.disabled = false;
        this.revealButton.setAttribute('aria-disabled', 'false');
    } else {
        if (this.gameState === 'choosingLetter' || (this.gameState === 'spinningWheel' && !this.isSpinning)) {
            this.revealButton.disabled = false;
            this.revealButton.setAttribute('aria-disabled', 'false');
        } else {
            this.revealButton.disabled = true;
            this.revealButton.setAttribute('aria-disabled', 'true');
        }
    }
  }

  getWordRevealStats() {
    let revealedLetterCount = 0;
    let totalLettersInWord = 0;
    
    this.gridMap.forEach((mapItem, gridIndex) => {
        if (mapItem && mapItem.char !== " ") {
            totalLettersInWord++;
            const gridItem = this.gridItems[gridIndex];
            if (gridItem && gridItem.classList.contains('revealed')) {
                revealedLetterCount++;
            }
        }
    });

    return { revealedLetterCount, totalLettersInWord };
  }

  disableAllActions() {
     this.spinButton.disabled = true; this.logoSpace.style.cursor = 'default';
     this.passButton.disabled = true; this.passButton.setAttribute('aria-disabled', 'true');
     this.revealButton.disabled = true; this.revealButton.setAttribute('aria-disabled', 'true');
     if(this.timerButton) this.timerButton.disabled = true;
     this.disableAlphabet(); this.clearCountdownTimer(); this.stopFloatingTimer();
  }

  disableAlphabet() { Object.values(this.alphabetLetters).forEach(el => { el.classList.add("disabled"); if (el.tagName === 'BUTTON') el.disabled = true; el.setAttribute('aria-disabled', 'true'); el.style.opacity = '0.6'; });}

  startTimer() { /* ... */ }
  clearCountdownTimer() { /* ... */ }
  handleTimerEnd() { /* ... */ }

  setupFloatingTimer() { if(this.timerButton) this.timerButton.addEventListener("click", () => this.startFloatingTimer()); }

  startFloatingTimer() {
      if (this.floatingTimerActive || this.isSpinning) return;
      this.floatingTimerActive = true; this.floatingTimerContainer.style.display = 'flex';
      this.floatingTimerContainer.classList.remove('hidden'); this.floatingTimerContainer.classList.add('visible');
      let timeLeft = this.FLOATING_TIMER_DURATION; this.floatingTimerCountdownDisplay.textContent = timeLeft;
      this.playSound(this.timerSound); if (this.floatingTimerInterval) clearInterval(this.floatingTimerInterval);
      this.floatingTimerInterval = setInterval(() => {
          timeLeft--; this.floatingTimerCountdownDisplay.textContent = timeLeft;
          if (timeLeft <= 0) {
              clearInterval(this.floatingTimerInterval); this.floatingTimerInterval = null;
              this.showToast("Tempo do cronômetro esgotado!", "info");
              setTimeout(() => this.stopFloatingTimer(), 1500);
          }
      }, 1000);
  }

  stopFloatingTimer() {
      if (this.floatingTimerInterval) { clearInterval(this.floatingTimerInterval); this.floatingTimerInterval = null; }
      this.floatingTimerActive = false;
      this.floatingTimerContainer.classList.remove('visible'); this.floatingTimerContainer.classList.add('hidden');
      setTimeout(() => { if (!this.floatingTimerActive) this.floatingTimerContainer.style.display = 'none'; }, 300);
      if (this.timerSound) { this.timerSound.pause(); this.timerSound.currentTime = 0; }
  }

  setupConfigTabs() {
      this.configTabLinks.forEach(link => link.addEventListener("click", () => this.activateTab(this.configTabLinks, this.configTabContents, link, link.getAttribute("data-tab"))));
      this.tutorialSubTabLinks.forEach(link => link.addEventListener("click", () => { if (!link.disabled) this.activateTab(this.tutorialSubTabLinks, this.tutorialSubTabContents, link, link.getAttribute("data-subtab")); }));
  }

  activateTab(links, contents, clickedLink, tabIdToShow) {
      links.forEach(l => { l.classList.remove("active"); l.setAttribute("aria-selected", "false"); });
      contents.forEach(c => c.classList.remove("active"));
      clickedLink.classList.add("active"); clickedLink.setAttribute("aria-selected", "true");
      const activeContent = document.getElementById(tabIdToShow);
      if (activeContent) activeContent.classList.add("active"); else console.warn("Conteúdo da aba não encontrado:", tabIdToShow);
  }

  setupGameSettingsControls() {
      if (this.loadLogoIngameButton) this.loadLogoIngameButton.addEventListener('click', () => { if (this.logoUploadIngameInput) this.logoUploadIngameInput.click(); });
      if (this.logoUploadIngameInput) this.logoUploadIngameInput.addEventListener('change', (event) => this.handleLogoUpload(event, 'ingame'));
      if (this.toggleSoundIngameButton) this.toggleSoundIngameButton.addEventListener('click', () => { this.soundEnabled = !this.soundEnabled; this.updateSoundToggleButtons(); this.showToast(`Som geral ${this.soundEnabled ? 'ativado' : 'desativado'}`, 'info'); });
      if (this.darkModeToggle) this.darkModeToggle.addEventListener('change', (event) => this.toggleDarkMode(event.target.checked));
      if (this.languageSelect) this.languageSelect.addEventListener('change', (event) => this.showToast(`Idioma: ${event.target.options[event.target.selectedIndex].text}. (Funcionalidade pendente)`, 'info'));
  }

  updateSoundToggleButtons() {
      const onI = "🔊", offI = "🔇", onT = "Som Ativado", offT = "Som Desativado";
      if (this.soundToggle) { this.soundToggle.textContent = this.soundEnabled ? onI : offI; this.soundToggle.setAttribute('aria-label', this.soundEnabled ? 'Desativar som' : 'Ativar som'); }
      if (this.toggleSoundIngameButton) this.toggleSoundIngameButton.innerHTML = `${this.soundEnabled ? onI : offI} ${this.soundEnabled ? onT : offT}`;
  }

  toggleDarkMode(isDark) {
      document.body.classList.toggle('dark-mode', isDark);
      localStorage.setItem('rodaARodaDarkMode', isDark ? 'enabled' : 'disabled');
      this.showToast(`Modo Escuro ${isDark ? 'Ativado' : 'Desativado'}`, 'info');
      const bgAnim = document.querySelector('.background-animation');
      if (bgAnim) { bgAnim.style.animation = 'none'; bgAnim.offsetHeight; bgAnim.style.animation = null; }
  }

  checkDarkModePreference() {
      const pref = localStorage.getItem('rodaARodaDarkMode');
      if (pref === 'enabled') { if (this.darkModeToggle) this.darkModeToggle.checked = true; document.body.classList.add('dark-mode'); }
      else { if (this.darkModeToggle) this.darkModeToggle.checked = false; document.body.classList.remove('dark-mode'); }
  }

  playSound(soundElement) { if (this.soundEnabled && soundElement) { soundElement.currentTime = 0; soundElement.play().catch(e => console.error("Erro ao tocar som:", e, soundElement.src)); }}

  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    const icons = {'success': '✅', 'warning': '⚠️', 'error': '❌', 'info': 'ℹ️', 'pass': '⏭️', 'loseall': '💸'};
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span>`;
    this.toastContainer.appendChild(toast); toast.offsetHeight;
    setTimeout(() => { if (toast.parentNode === this.toastContainer) this.toastContainer.removeChild(toast); }, duration);
  }

  normalizeLetter(letter) { if (!letter) return ''; return letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); }

  // --- FUNÇÃO MODIFICADA ---
  handleFileUpload(event, context, autoSelectFirst = false) {
    const file = event.target.files[0];
    const input = event.target;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = this.parseCSV(e.target.result);
            const newDb = this.transformCSVData(data); // Validação agora é feita dentro de transformCSVData

            if (newDb.length === 0) {
                this.showToast('Nenhum tema ou palavra válida foi encontrada no arquivo. Verifique o conteúdo e o formato.', 'warning', 6000);
                 if (context === 'initial') this.csvStatusInitial.textContent = "CSV inválido ou vazio.";
                 else this.csvStatusIngame.textContent = "CSV inválido ou vazio.";
            } else {
                this.userDatabase = newDb;
                this.showToast(`"${file.name}" carregado com sucesso: ${this.userDatabase.length} tema(s) encontrado(s).`, 'success');
                const sel = context === 'initial' ? this.themeSelectorInitial : this.themeSelectorIngame;
                this.updateThemeSelector(sel, autoSelectFirst);

                if (context === 'initial') {
                    if (sel) { sel.disabled = false; sel.removeAttribute('aria-disabled'); }
                    if (this.csvStatusInitial) this.csvStatusInitial.textContent = `"${file.name}" carregado.`;
                    this.checkInitialConfigReady();
                } else {
                    if (this.csvStatusIngame) this.csvStatusIngame.textContent = `"${file.name}" carregado.`;
                    if (this.currentTheme && !this.userDatabase.find(t => t.theme === this.currentTheme.theme)) {
                        this.showToast("Atenção: O tema atual não está na nova planilha.", "info", 6000);
                    }
                }
            }
        } catch (err) {
            console.error("Erro ao processar CSV:", err);
            this.showToast(`Erro ao processar arquivo: ${err.message}`, 'error');
            if (context === 'initial') this.csvStatusInitial.textContent = "Erro na leitura.";
            else this.csvStatusIngame.textContent = "Erro na leitura.";
        } finally {
            input.value = '';
            if (context === 'ingame' && this.themeSelectorIngame) {
                const isValid = this.themeSelectorIngame.value !== "" && this.userDatabase.length > 0;
                if (this.applyThemeAndRestartBtn) { this.applyThemeAndRestartBtn.disabled = !isValid; this.applyThemeAndRestartBtn.setAttribute('aria-disabled', String(!isValid));}
                if (this.confirmThemeChangeBtn) { this.confirmThemeChangeBtn.disabled = !isValid; this.confirmThemeChangeBtn.setAttribute('aria-disabled', String(!isValid));}
            } else if (context === 'initial') {
                this.checkInitialConfigReady();
            }
        }
    };
    reader.onerror = () => {
        this.showToast(`Erro ao ler o arquivo "${file.name}".`, "error");
        input.value = '';
        if (context === 'initial') this.csvStatusInitial.textContent = "Erro na leitura.";
        else this.csvStatusIngame.textContent = "Erro na leitura.";
    };
    reader.readAsText(file, 'UTF-8');
  }

  parseCSV(content) { return content.split(/\r?\n/).filter(l => l.trim() !== '').map(l => l.split(';').map(f => f.trim())); }

  validateCSV(data) {
    // Esta função não é mais necessária e pode ser removida, mas a deixamos aqui para evitar erros caso haja alguma chamada perdida.
    // A validação agora é feita de forma mais robusta dentro de transformCSVData.
    return true;
  }

  // --- FUNÇÃO MODIFICADA ---
  transformCSVData(csvData) {
    const map = {};
    const hasHeader = csvData[0]?.[0]?.toLowerCase() === 'tema' &&
                      csvData[0]?.[1]?.toLowerCase() === 'palavra' &&
                      csvData[0]?.[2]?.toLowerCase() === 'dica';
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < csvData.length; i++) {
        const row = csvData[i];
        // Validação de Linha: Garante que a linha exista e tenha os 3 campos necessários
        if (row && row.length >= 3) {
            const [theme, word, hint] = row;
            // Validação de Campo: Garante que os campos essenciais não sejam vazios
            if (theme && word && hint) {
                const upWord = word.toUpperCase();
                const wordsInPhrase = upWord.split(' ');

                // Regras de Negócio: Valida o tamanho da palavra/frase
                const isPhraseTooLong = wordsInPhrase.length > 3;
                const isAnyWordTooLong = wordsInPhrase.some(w => w.length > 12);

                if (isPhraseTooLong || isAnyWordTooLong) {
                    console.warn(`Palavra/Frase "${upWord}" ignorada por não seguir as regras de tamanho.`);
                    continue; // Pula para a próxima linha do arquivo
                }

                // Se tudo estiver correto, adiciona a palavra ao seu tema
                if (!map[theme]) {
                    map[theme] = { theme: theme, words: [] };
                }
                map[theme].words.push({ word: upWord, hint: hint, used: false });
            }
        }
    }
    return Object.values(map);
  }

  updateThemeSelector(selEl, autoFirst = false) {
      if (!selEl) return;
      const prevVal = selEl.value;
      let prevTxt = null;
      if (selEl.selectedIndex >= 0 && selEl.options[selEl.selectedIndex]) {
          prevTxt = selEl.options[selEl.selectedIndex].text.split(' (')[0];
      }

      selEl.innerHTML = `<option value="" disabled ${this.userDatabase.length === 0 || !autoFirst ? 'selected' : ''}>${this.userDatabase.length === 0 ? 'Carregue uma planilha CSV' : 'Selecione um tema'}</option>`;

      if (this.userDatabase.length > 0) {
          this.userDatabase.forEach((td, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = `${td.theme} (${td.words.length} palavras)`; selEl.appendChild(opt); });
          selEl.disabled = false; selEl.removeAttribute('aria-disabled');

          if (autoFirst && selEl.options.length > 1) {
              selEl.value = "0";
          } else {
               let reselected = false;
               if (prevTxt) {
                   for (let i = 0; i < this.userDatabase.length; i++) {
                       if (this.userDatabase[i].theme === prevTxt) {
                           selEl.value = String(i);
                           reselected = true;
                           break;
                       }
                   }
               }
               if (!reselected) {
                    if (selEl === this.themeSelectorIngame && this.currentTheme) {
                        const idx = this.userDatabase.findIndex(t => t.theme === this.currentTheme.theme);
                        selEl.value = idx !== -1 ? String(idx) : "";
                    }
                    else if (selEl.options.length > 1 && !autoFirst) {
                        selEl.value = "";
                    }
               }
           }
      } else {
          selEl.disabled = true; selEl.setAttribute('aria-disabled', 'true'); selEl.value = "";
      }

      if (selEl === this.themeSelectorIngame) {
          const isValid = selEl.value !== "" && this.userDatabase.length > 0;
          if (this.confirmThemeChangeBtn) { this.confirmThemeChangeBtn.disabled = !isValid; this.confirmThemeChangeBtn.setAttribute('aria-disabled', String(!isValid)); }
          if (this.applyThemeAndRestartBtn) { this.applyThemeAndRestartBtn.disabled = !isValid; this.applyThemeAndRestartBtn.setAttribute('aria-disabled', String(!isValid)); }
      } else if (selEl === this.themeSelectorInitial) {
          this.checkInitialConfigReady();
      }
  }

  populateIngameThemeSelector() { this.updateThemeSelector(this.themeSelectorIngame, false); }

  handleLogoUpload(event, context) {
      const file = event.target.files[0]; const input = event.target; if (!file) return;
      if (!file.type.startsWith('image/')) { this.showToast("Por favor, selecione um arquivo de imagem.", "error"); input.value = ''; return; }
      const reader = new FileReader();
      reader.onload = (e) => {
          this.customLogo = e.target.result; this.applyLogo(); this.showToast("Logo carregado com sucesso!", "success");
          if (context === 'ingame' && this.logoStatusIngame) this.logoStatusIngame.textContent = `"${file.name}" carregado.`;
          input.value = '';
      };
      reader.onerror = () => { this.showToast("Erro ao carregar o logo.", "error"); if (context === 'ingame' && this.logoStatusIngame) this.logoStatusIngame.textContent = "Erro ao carregar logo."; input.value = ''; }
      reader.readAsDataURL(file);
  }

  applyLogo() {
      if (this.customLogo) { Object.assign(this.logoSpace.style, {backgroundImage: `url(${this.customLogo})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: 'transparent'}); this.spinButton.style.display = 'none'; }
      else { Object.assign(this.logoSpace.style, {backgroundImage: '', backgroundColor: '#d4af37'}); this.spinButton.style.display = 'flex'; }
  }

  loadStats() {
      try {
          const s = localStorage.getItem('rodaARodaStats'); if (s) { const p = JSON.parse(s);
          this.gameStats = {
              totalRoundsPlayed: p.totalRoundsPlayed || 0,
              roundsByMode: {
                  classic: p.roundsByMode?.classic || 0,
                  quick: p.roundsByMode?.quick || 0,
                  concept: p.roundsByMode?.concept || 0
              },
              highScores: {
                  classic: p.highScores?.classic || 0,
                  quick: p.highScores?.quick || 0,
                  concept: p.highScores?.concept || 0
              },
              fastestReveal: p.fastestReveal || {time:Infinity, word:'', theme:''}
          };}}
      catch (err) { console.error("Erro ao carregar estatísticas:", err); this.gameStats = {totalRoundsPlayed:0,roundsByMode:{classic:0,quick:0,concept:0},highScores:{classic:0,quick:0,concept:0},fastestReveal:{time:Infinity,word:'',theme:''}};}
  }

  saveStats() { try { localStorage.setItem('rodaARodaStats', JSON.stringify(this.gameStats)); } catch (err) { console.error("Erro ao salvar estatísticas:", err); this.showToast("Erro ao salvar estatísticas.", "error"); }}

  updateStats(type, value) {
      let changed = false; const mode = this.selectedGameMode || 'classic';
      switch (type) {
          case 'roundFinished': this.gameStats.totalRoundsPlayed = (this.gameStats.totalRoundsPlayed||0)+1; if(this.gameStats.roundsByMode.hasOwnProperty(mode)) this.gameStats.roundsByMode[mode]=(this.gameStats.roundsByMode[mode]||0)+1; else this.gameStats.roundsByMode[mode]=1; changed=true; break;
          case 'wordRevealed': if (value && value.time < (this.gameStats.fastestReveal?.time||Infinity)) { this.gameStats.fastestReveal={time:value.time,word:value.word,theme:value.theme}; changed=true; } break;
          case 'highScore':
            if(!this.gameStats.highScores.hasOwnProperty(mode)) this.gameStats.highScores[mode]=0;
            if (value > (this.gameStats.highScores[mode]||0)) {
                this.gameStats.highScores[mode]=value; changed=true;
            }
            break;
      }
      if (changed) this.saveStats();
  }

  displayStats() {
      const s = this.gameStats; let h = '';
      h += `<p><strong>Total de Rodadas Jogadas:</strong> ${s.totalRoundsPlayed||0}</p>`;
      h += `<p><strong>Rodadas por Modo:</strong></p><ul><li>Clássico: ${s.roundsByMode?.classic||0}</li><li>Resposta Rápida: ${s.roundsByMode?.quick||0}</li><li>Conceitual: ${s.roundsByMode?.concept||0}</li></ul>`;
      h += `<p><strong>Recordes de Pontuação:</strong></p><ul><li>Clássico: R$${s.highScores?.classic||0}</li><li>Resposta Rápida: R$${s.highScores?.quick||0}</li><li>Conceitual: R$${s.highScores?.concept||0}</li></ul>`;
      if (s.fastestReveal && s.fastestReveal.time !== Infinity && s.fastestReveal.word) { h += `<p><strong>Revelação Mais Rápida:</strong></p><p>Tempo: ${s.fastestReveal.time.toFixed(2)}s</p><p>Palavra: "${s.fastestReveal.word}" (Tema: ${s.fastestReveal.theme||'N/A'})</p>`;}
      else h += `<p><strong>Revelação Mais Rápida:</strong> Nenhuma registrada</p>`;
      this.statsDisplayArea.innerHTML = h;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  
  window.rodaARodaGame = new RodaARodaGame();
});