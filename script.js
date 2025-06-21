const deepClone = obj => JSON.parse(JSON.stringify(obj));

function isObject(variable) {
  return (
    typeof variable === 'object' &&
    variable !== null &&
    !Array.isArray(variable)
  )
}

function styleObjectToString(styles) {
  return Object.entries(styles).reduce((acc, [key, value]) => {
      // Convert camelCase to kebab-case for CSS properties
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return acc + `${cssKey}: ${value}; `;
  }, '').trim();
}

function parseStyleString(styleString) {
  const styleObj = {}
  styleString = styleString.replace(/: +/g, ':')
  styleString = styleString.replace(/; +/g, ';')
  const propValStrings = styleString.split(';')
  propValStrings.forEach((propValString) => {
    if (propValString.includes(':')) {
      const pair = propValString.split(':')
      styleObj[pair[0]] = pair[1]
    }
  })

  return styleObj
}

function parseClassString(classString) {
  if(Array.isArray(classString)) {
    return classString
  }
  classString = classString.replace(/,/g, ' ')
  classString = classString.replace(/ +/g, ' ')
  return classString.split(' ')
}

function addProperty(keyName, destObj, donorObj) {
	if(!destObj.hasOwnProperty(keyName)) {
  	destObj[keyName] = donorObj[keyName]
  }

  return destObj[keyName] === donorObj[keyName] ? "success" : "failure";
}

function removeProperty(keyName, destObj) {
	if(destObj.hasOwnProperty(keyName)) {
  	delete destObj[keyName]
  }

  return !destObj.hasOwnProperty(keyName) ? "success" : "failure";
}

function overwriteProperty(keyName, destObj, donorObj) {
  destObj[keyName] = donorObj[keyName]

  return destObj[keyName] === donorObj[keyName] ? "success" : "failure";
}

function toggleProperty(keyName, destObj, donorObj) {
	let result
  if(destObj.hasOwnProperty(keyName)) {
  	const wasRemoved = removeProperty(keyName, destObj)
  	result = wasRemoved === "success" ? "removed" : "failure";
  } else {
  	const wasAdded = addProperty(keyName, destObj, donorObj)
    result = wasAdded === "success" ? "added" : "failure";
  }

  return result
}

const updateObjProp = {
	add: (keyName, destObj, donorObj) => {
  	return addProperty(keyName, destObj, donorObj)
  },
  remove: (keyName, destObj, donorObj) => {
  	return removeProperty(keyName, destObj, donorObj)
  },
  overwrite: (keyName, destObj, donorObj) => {
  	return overwriteProperty(keyName, destObj, donorObj)
  },
  toggle: (keyName, destObj, donorObj) => {
  	return toggleProperty(keyName, destObj, donorObj)
  },
}

function updateObjProps(destObj, donorObj, mode='overwrite') {
  let objKeys
  if (isObject(donorObj)) {
    objKeys = Object.keys(donorObj)
  } else if (Array.isArray(donorObj) && ['remove'].includes(mode)) {
    objKeys = donorObj
  } else {
    return
  }
  objKeys.forEach((keyName) => {
    updateObjProp[mode](keyName, destObj, donorObj)
  })
}

const updateCssClass = {
  add: (className, domElement) => {
    domElement.classList.add(className)
  },
  remove: (className, domElement) => {
    domElement.classList.remove(className)
  },
  toggle: (className, domElement) => {
    domElement.classList.toggle(className)
  },
}

function getElement(elem) {
  if (typeof elem === 'string') {
    elem = document.getElementById(elem)
  }
  return elem
}

function newElement(attrs = {}) {
  // determine which HTML tag to use for the new DOM element (<div> by default)
  const tag = attrs.hasOwnProperty("tag") ? attrs["tag"] : "div";
  const newElem = document.createElement(tag);
  return updateElement(newElem, attrs)
}

function updateElement(updateElem, attrs = {}) {
  updateElem = getElement(updateElem)
  // determine the parent element in which the new element should be nested (<body> by default)

  let parent
  if (attrs.hasOwnProperty("parent")) {
    parent = getElement(attrs.parent);
  } else if (updateElem.parentNode && updateElem.parentNode !== document.body) {
    parent = updateElem.parentNode
  } else {
    parent = document.body
  }
  parent.append(updateElem);

  // convert the style property to an HTML-friendly string if expressed as a JavaScript Object
  // e.g. { color: "black", fontSize: "13px" } ==> "color: black; font-size: 10px;"
  if (attrs.hasOwnProperty("style") && isObject(attrs.style)) {
    attrs.style = styleObjectToString(attrs.style);
  }
  // set innerText and/or innerHTML properties if specified
  if (attrs.hasOwnProperty("text")) { updateElem.innerText = attrs.text; }
  if (attrs.hasOwnProperty("html")) { updateElem.innerHTML = attrs.html; }

  // use one of four methods for updating CSS style props and classes:
  // "add", "remove", "toggle", and "overwrite" (styles only)
  if (attrs.hasOwnProperty("updateMode") && updateObjProp[attrs.updateMode]) {
    if (attrs.hasOwnProperty("style")) {
      const destStyle = parseStyleString(updateElem.getAttribute("style"))
      const donorStyle = parseStyleString(attrs.style)
      updateObjProps(destStyle, donorStyle, mode=attrs.updateMode)
      attrs.style = styleObjectToString(destStyle)
    }
    if (attrs.hasOwnProperty("class") && updateCssClass[attrs.updateMode]) {
      const newClasses = parseClassString(attrs.class)
      newClasses.forEach((className) => {
        updateCssClass[attrs.updateMode](className, updateElem)
      })
      delete attrs.class
    }
  }

  // remove keys from object that are not valid HTML tag attributes
  const nonHtmlAttrs = ["tag", "parent", "text", "html", "updateMode"];
  nonHtmlAttrs.forEach((key) => {
    delete attrs[key];
  });
  // add all other specified attributes to the new element
  for (const key in attrs) {
    updateElem.setAttribute(key, attrs[key]);
  }

  return updateElem
}

function toggleVisible(element, setVisible=null) {
  const e = getElement(element)
  if (setVisible === null) {
    e.style.visibility = e.style.visibility === "hidden" ? null : "hidden";
  } else {
    e.style.visibility = setVisible === true ? null : "hidden";
  }
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min; // min: inc; max: exc
const randItem = (list) => list[randInt(0, list.length)];
const removeItemByValue = (arr, value) => arr.filter(item => item !== value);

function wrappedIndex(list, index, offset) {
  const targetIndex = index + offset
  const negative = targetIndex < 0
  const wrapped = Math.abs(targetIndex) % list.length
  return negative ? list.length - wrapped : wrapped
}

function itemByOffset(list, item, offset) {
  return list[wrappedIndex(list, list.indexOf(item), offset)]
}

function copyToClipboard(inputField, onSuccess=() => {console.log("Copied!")}) {
  inputField.select();
  try {
    document.execCommand('copy');
    onSuccess();
  } catch (err) {
    console.error('Unable to copy text', err);
  }
}

function fetchJSON(url, updateFunction) {
  fetch(url)
    .then(function (promise) {
      return promise.json();
    })
    .then(function (data) {
      updateFunction(data);
    })
    .catch(function (error) {
      console.error('Error:', error);
    });
}

const COL_COUNT = 10
const ROW_COUNT = 20
const SQUARE_SIZE = `calc(100vh / ${ROW_COUNT})`
const GRID_WIDTH = `calc(${SQUARE_SIZE} * ${COL_COUNT})`

const main = newElement({
  style: {
    position: 'relative',
    minWidth: '100vw',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

const domGrid = newElement({
  parent: main,
  style: {
    position: 'relative',
    minWidth: GRID_WIDTH,
    minHeight: '100vh',
    backgroundColor: 'slategrey',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'start',
    alignItems: 'center',
  },
})

const pauseScreen = newElement({
  parent: main,
  style: {
    position: 'absolute',
    minWidth: GRID_WIDTH,
    minHeight: '100vh',
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    visibility: 'hidden', // hidden by default
  }
})

const pauseText = newElement({
  parent: pauseScreen,
  tag: 'h1',
  text: 'PAUSE',
  style: {
    color: 'white',
    userSelect: 'none',
  },
})

const GAME_GRID = {}

function pos2d(x, y) {
  return { x: x, y: y }
}

const getGridId = (pos) => `grid_${pos.x}-${pos.y}`

function resetGridSquare(pos) {
  GAME_GRID[pos.x][pos.y] = { id: getGridId(pos), className: 'empty', pos: pos }
}


for (let y = 0; y < ROW_COUNT; y++) {
  const newRow = newElement({
    parent: domGrid,
    style: {
      display: 'flex',
      flexWrap: 'no-wrap',
      minWidth: '100%',
      minHeight: SQUARE_SIZE,
    },
  })
  for (let x = 0; x < COL_COUNT; x++) {
    const pos = pos2d(x, y)
    const newSquare =newElement({
      parent: newRow,
      id: getGridId(pos),
      style: {
        minWidth: SQUARE_SIZE,
        minHeight: SQUARE_SIZE,
      },
    })
    GAME_GRID[x] = GAME_GRID[x] || {}
    GAME_GRID[x][y] = {}
    resetGridSquare(pos)
  }
}

function updateDomGridSquare(gridSquareObj) {
  const domGridSquare = getElement(gridSquareObj.id)
  Object.keys(gridSquareObj).forEach((key) => {
    domGridSquare[key] = gridSquareObj[key]
  })
}

function updateDomGrid() {
  Object.keys(GAME_GRID).forEach((x) => {
    const col = GAME_GRID[x]
    Object.keys(col).forEach((y) => {
      const gridSquareObj = col[y]
      updateDomGridSquare(gridSquareObj)
    })
  })
}

const DIR = {
  up:    pos2d( 0, -1),
  right: pos2d( 1,  0),
  down:  pos2d( 0,  1),
  left:  pos2d(-1,  0),
}

const DIR_NAMES = Object.keys(DIR)

function rotatedDir(dirName, rotationMode='cw') {
  rotationMode = rotationMode.toLowerCase()
  const rotationOffsets = { 'cw': 1, 'ccw': -1 }
  return itemByOffset(DIR_NAMES, dirName, rotationOffsets[rotationMode])
}


function addPos(p1, p2) {
  return pos2d(p1.x + p2.x, p1.y + p2.y)
}

function subtractPos(p1, p2) {
  return pos2d(p1.x - p2.x, p1.y - p2.y)
}

function multiplyPos(p1, p2) {
  return pos2d(p1.x + p2.x, p1.y + p2.y)
}

function getDistance(p1, p2) {
  return pos2d(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y))
}

function posInDir(pos, dirName) {
  return addPos(pos, DIR[dirName])
}

function nStepsInDir(pos, dirName, steps) {
  for (let i = 0; i < steps; i++) {
    pos = posInDir(pos, dirName)    
  }
  return pos
}

function getGlobalPos(originPos, pos) {
  return addPos(pos, originPos)
}

function getRelativePos(originPos, pos) {
  return subtractPos(pos, originPos)
}

function rotatePos(originPos, pos, rotationMode='cw') {
  const relativePos = getRelativePos(originPos, pos)
  const clockwise = rotationMode === 'cw'
  let x = clockwise ? relativePos.y * -1 : relativePos.y
  let y = clockwise ? relativePos.x : relativePos.x * -1
  return addPos(pos2d(x, y), originPos)
}

function getGridSquare(pos) {
  return GAME_GRID[pos.x][pos.y]
}

function getDomSquare(pos) {
  return getElement(getGridId(pos))
}

function getAbsoluteOffsets(pos) {
  return {
    top: `calc(${pos.y} * ${SQUARE_SIZE})`,
    left: `calc(${pos.x} * ${SQUARE_SIZE})`,
  }
}

function moveToAbsolutePos(domElement, pos, rotation=0) {
  const offsets = getAbsoluteOffsets(pos)
  domElement.style.transform = `translate(${0}, ${offsets.top}) rotate(${rotation}deg)`
  domElement.style.left = offsets.left
}

function updateGridSquare(pos, attrs = {}) {
  const newProps = deepClone(attrs)
  // remove static properties
  updateObjProps(newProps, ['id', 'pos'], mode='remove')
  
  updateObjProps(getGridSquare(pos), newProps)
}

function moveToPos(pos1, pos2) {
  if (!isOpenPos(pos2) || !isValidPos(pos1)) return

  updateGridSquare(pos2, getGridSquare(pos1))
  resetGridSquare(pos1)
}

function moveInDir(pos, dirName) {
  moveToPos(pos, posInDir(pos, dirName))
}

function isTypePos2d(pos) {
  if (isObject(pos) && 'x' in pos && 'y' in pos) {
    if (typeof pos.x === 'number' && typeof pos.y === 'number') {
      return true
    }
  }
  return false
}

function isValidPos(pos) {
  if (!isTypePos2d(pos)) return false
  if (GAME_GRID[pos.x] && GAME_GRID[pos.x][pos.y]) {
    return true
  }
  return false
}

function isOpenPos(pos) {
  if (isValidPos(pos)) {
    const gridSquare = getGridSquare(pos)
    return gridSquare && gridSquare.className === 'empty' ? true : false
  }
  return false
}

function batchCheckPositions(posList, checkFunc) {
  for (let i = 0; i < posList.length; i++) {
    const pos = posList[i]
    if (checkFunc(pos) === false) return false
  }
  return true
}

function batchTransformPositions(posList, updateFunc) {
  return posList.map((pos) => updateFunc(pos))
}

function getActiveOrigin() {
  return ACTIVE.pos
}

function getLocalToGlobalPosList() {
  if (!ACTIVE) return []

  return ACTIVE.blocks.map((block) => getGlobalPos(ACTIVE.pos, block.pos))
}

function allPositionsOpen(positions=getLocalToGlobalPosList()) {
  return batchCheckPositions(positions, isOpenPos)
}

function allOpenInDir(dirName) {
  const activePositions = getLocalToGlobalPosList()
  const newPositions = batchTransformPositions(activePositions, (pos) => posInDir(pos, dirName))
  return allPositionsOpen(newPositions)
}

function allOpenAfterRotation(rotationMode='cw', translateByPos2d=pos2d(0,0)) {
  const activeOrigin = addPos(getActiveOrigin(), translateByPos2d)
  let activePositions = getLocalToGlobalPosList()
  activePositions = batchTransformPositions(activePositions, (pos) => addPos(pos, translateByPos2d))
  const newGlobalPositions = batchTransformPositions(activePositions, (pos) => rotatePos(activeOrigin, pos, rotationMode))
  return allPositionsOpen(newGlobalPositions)
}

function batchUpdateGridSquares(updateFunc) {
  for (let y = ROW_COUNT - 1; y >= 0; y--) {
    for (let x = COL_COUNT - 1; x >= 0; x--) {
      updateFunc(pos2d(x, y))
    }
  }
}

function clearRow(rowNum) {
  batchUpdateGridSquares((pos) => {
    if (pos.y === rowNum) {
      updateGridSquare(pos, { className: 'empty' })
    }
  })
  updateDomGrid()
}

function shiftBlocksDown(bottomRowNum) {
  batchUpdateGridSquares((pos) => {
    if (pos.y < bottomRowNum) {
      moveInDir(pos, 'down')
    }
    // else if (pos.y === bottomRowNum) {
    //   updateGridSquare(pos, { className: 'empty' })
    // }
  })
  // updateDomGrid()
}

function clearRows(rowNums, delayMs=111) {
  // ensure descending numbers to go from bottom up
  rowNums.sort((a, b) => a - b)
  rowNums.forEach((rowNum) => {
    clearRow(rowNum)
  })
  rowNums.forEach((rowNum, index) => {
    setTimeout(() => {
      shiftBlocksDown(rowNum)
      updateDomGrid()
    }, delayMs * (index + 1));
  })
}

function findCompleteRows() {
  const fullRows = []
  for (let y = ROW_COUNT - 1; y >= 0; y--) {
    let fullRow = true
    for (let x = COL_COUNT - 1; x >= 0; x--) {
      const gridSquare = getGridSquare(pos2d(x, y))
      if (!gridSquare.className.includes('block')) {
        fullRow = false
        break
      }
    }
    if (fullRow) {
      fullRows.push(y)
    }
  }
  clearRows(fullRows)
}

updateDomGrid()

let ACTIVE = null

function clearActiveDomElements() {
  if (!ACTIVE) return

  ACTIVE.blocks.forEach((block) => {
    block.domElement.remove()
  })

  ACTIVE.domElement.remove()
}

function lockBlocksToGrid() {
  if (!ACTIVE) return
  
  ACTIVE.blocks.forEach((block) => {
    updateGridSquare(getGlobalPos(ACTIVE.pos, block.pos), { className: `block ${ACTIVE.color}` })
  })
  updateDomGrid()
}

PIECES = [
  { color: 'blue', blockRotation: 'full', positions: '0,0|-1,0|1,0|0,-1' },
  { color: 'yellow', blockRotation: 'toggle', positions: '0,0|0,-1|1,0|1,1' },
  { color: 'lime', blockRotation: 'toggle', positions: '0,0|0,-1|-1,0|-1,1' },
  { color: 'red', blockRotation: 'toggle', positions: '0,0|0,-1|0,1|0,2' },
  { color: 'orange', blockRotation: 'static', positions: '0,0|1,0|0,1|1,1' },
  { color: 'cyan', blockRotation: 'full', positions: '0,0|0,-1|0,1|1,1' },
  { color: 'magenta', blockRotation: 'full', positions: '0,0|0,-1|0,1|-1,1' },
]

function setNewActive({origin=pos2d(5,2)} = {}) {
  lockBlocksToGrid()
  clearActiveDomElements()

  const newPiece = randItem(PIECES)

  ACTIVE = {
    domElement: newElement({
      parent: domGrid,
      class: 'active transition-x transition-y'
    }),
    blocks: [],
    color: newPiece.color,
    dir: 'up',
    pos: origin,
    blockRotation: newPiece.blockRotation,
  }
  posList = parsePosString(newPiece.positions)
  posList.forEach((pos) => {
    const isOrigin = pos.x === 0 && pos.y === 0
    addChildBlockToActive({pos: pos, color: newPiece.color, origin: isOrigin})
  })
  moveToAbsolutePos(ACTIVE.domElement, origin)
  
  if (!allPositionsOpen(getLocalToGlobalPosList())) {
    handleGameOver()
  }
}

function addChildBlockToActive({pos=pos2d(0, 0), origin=false, color='blue'} = {}) {
  // if (!isOpenPos(pos)) return

  const newActiveBlock = newElement({
    parent: ACTIVE.domElement,
    class: `active block ${color}`,
    style: {
      minWidth: SQUARE_SIZE,
      minHeight: SQUARE_SIZE,
    }
  })
  ACTIVE.blocks.push(
    {
      domElement: newActiveBlock,
      pos: pos,
      origin: origin,
      color: color,
    }
  )
  moveToAbsolutePos(newActiveBlock, pos)
}

function updateBlockPos(activeBlock, newPos, move=true) {
  if (move) {
    moveToAbsolutePos(activeBlock.domElement, newPos)
  }
  activeBlock.pos = deepClone(newPos)
}

function translateBlockInDir(activeBlock, dirName) {
  const newPos = posInDir(activeBlock.pos, dirName)
  updateBlockPos(activeBlock, newPos)
}

function translateActive(dirName) {
  if (!allOpenInDir(dirName)) return 'stuck'

  // ACTIVE.blocks.forEach((block) => {
  //   translateBlockInDir(block, dirName)
  // })
  translateBlockInDir(ACTIVE, dirName)
}

function getBlockPosUnderActive() {
  const activeCol = ACTIVE.pos.x
  for (let y = 0; y < ROW_COUNT; y++) {
    const gridSquare = getGridSquare(pos2d(activeCol, y))
    if (!gridSquare.className.includes('empty')) {
      return gridSquare.pos
    }
  }
  return pos2d(activeCol, ROW_COUNT - 1)
}

function getLowestPos() {
  const activePositions = getLocalToGlobalPosList()

  let newPositions = activePositions
  let downShiftAmount = -1
  do {
    downShiftAmount += 1
    newPositions = batchTransformPositions(newPositions, (pos) => posInDir(pos, 'down'))    
  } while (allPositionsOpen(newPositions))

  const newRootPos = addPos(ACTIVE.pos, pos2d(0, downShiftAmount))
  return newRootPos
}

const TIME_PER_BLOCK_MS = 700 / ROW_COUNT

function adjustedFallDuration() {
  const blocksToTravel = getDistance(ACTIVE.pos, getLowestPos()).y
  const transitionTimeMs = TIME_PER_BLOCK_MS * blocksToTravel
  return transitionTimeMs >= 1 ? transitionTimeMs : 1
  // return timePerBlockMs
}

function slamDown() {
  const fallDuration = adjustedFallDuration()

  ACTIVE.domElement.classList.remove('transition-y')
  if (fallDuration >= TIME_PER_BLOCK_MS) {
    // only add transition if falling more than one block
    ACTIVE.domElement.style.transition = `transform ${fallDuration}ms linear`
  }
  updateBlockPos(ACTIVE, getLowestPos())
}

function rotateBlocks(rotationMode='cw', attempts=0) {
  if (ACTIVE.blockRotation === 'static') return
  if (attempts > 5) return

  if (!allOpenAfterRotation(rotationMode)) {
    // check if able to rotate after shifting horizontally in either direction
    const xShifts = [-1,1]
    for (let x of xShifts) {
      const horizontalShift = pos2d(x, 0)
      const activePositions = getLocalToGlobalPosList()
      const adjustedPositions = batchTransformPositions(activePositions, (pos) => {
        return addPos(pos, horizontalShift)
      })

      if(allPositionsOpen(adjustedPositions)) {
        updateBlockPos(ACTIVE, addPos(ACTIVE.pos, horizontalShift))
        // recurse if horzontal shift successful
        rotateBlocks(rotationMode, attempts=attempts + 1)
      }
    }
  } else {
    ACTIVE.blocks.forEach((block) => {
      updateBlockPos(block, rotatePos(pos2d(0,0), block.pos, rotationMode='cw'))
    })
  }
  // const currentRotation = window.getComputedStyle(ACTIVE.domElement).getPropertyValue('transform')
  // console.log(currentRotation)
  // ACTIVE.domElement.style.transform = `rotate(90deg) `
  // // ACTIVE.domElement.style.rotate = '90deg'
  // moveToAbsolutePos(ACTIVE.domElement, ACTIVE.pos, 90)
}

function parsePosString(posString, valSep=',', pairSep='|') {
  const posList = []
  const pairs = posString.split(pairSep)
  pairs.forEach((pair) => {
    const values = pair.split(valSep)
    posList.push(pos2d(parseFloat(values[0]), parseFloat(values[1])))
  })
  return posList
}

function posListToString(posList, valSep=',', pairSep='|') {
  const output = posList.map((pos) => `${pos.x}${valSep}${pos.y}`)
  return output.join(pairSep)
}

const square2 = getDomSquare(pos2d(8,8))

const NUM_CHARS = [0,1,2,3,4,5,6,7,8,9].map((num) => String(num))
let GAME_PAUSE = false
let GAME_OVER = false

const gameHalted = () => GAME_OVER || GAME_PAUSE

function handlePause() {
  GAME_PAUSE = !GAME_PAUSE
  toggleVisible(domGrid, setVisible=!GAME_PAUSE)
  toggleVisible(pauseScreen, setVisible=GAME_PAUSE)
}

function handleGameOver() {
  GAME_OVER = true
  toggleVisible(pauseScreen, setVisible=true)
  pauseText.textContent = 'GAME OVER'
  
  const restartButton = newElement({
    parent: pauseScreen,
    tag: 'button',
    text: 'Play Again',
    style: {
      marginTop: '20px',
      padding: '10px',
      fontSize: '33px',
    },
    class: 'restart-button',
  })

  restartButton.addEventListener('click', () => {
    location.reload()
  })
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    handlePause()
  }
  if (gameHalted()) return

  if (event.key === 'ArrowLeft') {
    translateActive('left')
  }
  if (event.key === 'ArrowRight') {
    translateActive('right')
  }
  if (event.key === 'ArrowDown') {
    // translateActive('down')
    slamDown()
  }
  if (event.key === 'ArrowUp') {
    rotateBlocks()
  }
})

setNewActive()

let previousPositions

const mainLoop = setInterval(() => {
  if (gameHalted()) return

  updateDomGrid()

  translateActive('down')

  const currentPositions = (posListToString(getLocalToGlobalPosList()))
  if (currentPositions === previousPositions) {
    setNewActive()
    findCompleteRows()
  }

  previousPositions = currentPositions
}, 333)