FX = { }

FX.debug = false

FX.SetDebugEnabled = function(enabled) {

}

FX.IsDebugEnabled = function(){
  return false
}

var menus = {}

var keys = {
   down         : 187,
   up           : 188,
   left         : 189,
   right        : 190,
   select       : 191,
   back         : 194
}

var optionCount         = 0

var currentKey          = null
var currentMenu         = null

var toolTipWidth        = 0.153

var spriteWidth         = 0.027
var spriteHeight        = spriteWidth * GetAspectRatio()

var titleHeight         = 0.101
var titleYOffset        = 0.021
var titleFont           = 1
var titleScale          = 1.0

var buttonHeight        = 0.038
var buttonFont          = 0
var buttonScale         = 0.365
var buttonTextXOffset   = 0.005
var buttonTextYOffset   = 0.005
var buttonSpriteXOffset = 0.002
var buttonSpriteYOffset = 0.005

var defaultStyle = {
	x : 0.0175,
	y : 0.025,
	width : 0.23,
	maxOptionCountOnScreen : 10,
	titleColor : [ 0, 0, 0, 255 ],
	titleBackgroundColor : [ 245, 127, 23, 255 ],
	titleBackgroundSprite : null,
	subTitleColor : [ 245, 127, 23, 255 ],
	textColor : [ 255, 255, 255, 255 ],
	subTextColor : [ 189, 189, 189, 255 ],
	focusTextColor : [ 0, 0, 0, 255 ],
	focusColor : [ 245, 245, 245, 255 ],
	backgroundColor : [ 0, 0, 0, 160 ],
	subTitleBackgroundColor : [ 0, 0, 0, 255 ],
	buttonPressedSound : { name : 'SELECT', set : 'HUD_FRONTEND_DEFAULT_SOUNDSET' } //https://pastebin.com/0neZdsZ5
}

function setMenuProperty(id, property, value) {
  if(!id) return

  var menu = menus[id]
  if(menu) menu[property] = value
}

function setStyleProperty(id, property, value) {
  if(!id) return

  var menu = menus[id]

  if(menu) {
    if(!menu.overrideStyle) {
      menu.overrideStyle = {}
    }
    menu.overrideStyle[property] = value
  }
}

function getStyleProperty(property, menu) {
  menu = menu || currentMenu
  if(menu.overrideStyle) {
    var value = menu.overrideStyle[property]
    if(value) return value
  }

  return menu.style && menu.style[property] || defaultStyle[property]
}

function copyTable(t) {
  if( typeof t !== 'object') return t

  var result = {}
  for (const [k, v] of Object.entries(t)) {
    result[k] = copyTable
  }

  return result
}

function setMenuVisible(id, visible, holdCurrentOption) {
  if(currentMenu) {
    if(visible) {
      if(currentMenu.id === id) {
        return
      }
    } else {
      if(currentMenu.id !== id) {
        return
      }
    }
  }

  if(visible) {
    var menu = menus[id]
    if(!currentMenu) {
      menu.currentOption = 1
    } else {
      if(!holdCurrentOption) {
        menus[currentMenu.id].currentOption = 1
      }
    }
    currentMenu = menu
  } else {
    currentMenu = null
  }
}

function setTextParams(font, color, scale, center, shadow, alignRight, wrapFrom, wrapTo) {
  SetTextFont(font)
	SetTextColour(color[0], color[1], color[2], color[3] || 255)
	SetTextScale(scale, scale)

  if(shadow) {
    SetTextDropShadow()
  }

  if(center) {
    SetTextCentre(true)
  } else if(alignRight) {
    SetTextRightJustify(true)
  }

  if(!wrapFrom || !wrapTo) {
    wrapFrom = wrapFrom || getStyleProperty('x')
		wrapTo = wrapTo || getStyleProperty('x') + getStyleProperty('width') - buttonTextXOffset
  }

  SetTextWrap(wrapFrom, wrapTo)
}

function getLinesCount(text, x, y) {
  BeginTextCommandLineCount('STRING')
  AddTextComponentString(text.toString())
  return EndTextCommandGetLineCount(x, y)
}

function drawText(text, x, y) {
  BeginTextCommandDisplayText('STRING')
	AddTextComponentString(text.toString())
	EndTextCommandDisplayText(x, y)
}

function drawRect(x, y, width, height, color) {
  DrawRect(x, y, width, height, color[0], color[1], color[2], color[3] || 255)
}

 function getCurrentIndex() {
   if(currentMenu.currentOption <= getStyleProperty('maxOptionCountOnScreen') && optionCount <= getStyleProperty('maxOptionCountOnScreen')) {
     return optionCount
   } else if( optionCount > currentMenu.currentOption - getStyleProperty('maxOptionCountOnScreen') && optionCount <= currentMenu.currentOption) {
     return optionCount - (currentMenu.currentOption - getStyleProperty('maxOptionCountOnScreen'))
   }

   return null
 }

function drawTitle() {
  var x = getStyleProperty('x') + getStyleProperty('width') / 2
	var y = getStyleProperty('y') + titleHeight / 2

  if(getStyleProperty('titleBackgroundSprite')) {
    DrawSprite(getStyleProperty('titleBackgroundSprite').dict, getStyleProperty('titleBackgroundSprite').name, x, y, getStyleProperty('width'), titleHeight, 0., 255, 255, 255, 255)
  } else {
    drawRect(x, y, getStyleProperty('width'), titleHeight, getStyleProperty('titleBackgroundColor'))
  }

  if(currentMenu.title) {
    setTextParams(titleFont, getStyleProperty('titleColor'), titleScale, true)
		drawText(currentMenu.title, x, y - titleHeight / 2 + titleYOffset)
  }
}

function drawSubTitle() {
  var x = getStyleProperty('x') + getStyleProperty('width') / 2
	var y = getStyleProperty('y') + titleHeight + buttonHeight / 2

  drawRect(x, y, getStyleProperty('width'), buttonHeight, getStyleProperty('subTitleBackgroundColor'))

  setTextParams(buttonFont, getStyleProperty('subTitleColor'), buttonScale, false)
	drawText(currentMenu.subTitle, getStyleProperty('x') + buttonTextXOffset, y - buttonHeight / 2 + buttonTextYOffset)

  if(optionCount > getStyleProperty('maxOptionCountOnScreen')) {
    setTextParams(buttonFont, getStyleProperty('subTitleColor'), buttonScale, false, false, true)
		drawText(currentMenu.currentOption.toString() + ' / '+ optionCount.toString(), getStyleProperty('x') + getStyleProperty('width'), y - buttonHeight / 2 + buttonTextYOffset)
  }
}

function drawButton(text, subText) {
  var currentIndex = getCurrentIndex()
  if(!currentIndex) {
    return
  }

  var backgroundColor   = null
  var textColor         = null
  var subTextColor      = null
  var shadow            = false

  if(currentMenu.currentOption == optionCount) {
    backgroundColor = getStyleProperty('focusColor')
		textColor = getStyleProperty('focusTextColor')
		subTextColor = getStyleProperty('focusTextColor')
  } else {
    backgroundColor = getStyleProperty('backgroundColor')
		textColor = getStyleProperty('textColor')
		subTextColor = getStyleProperty('subTextColor')
		shadow = true
  }

  var x = getStyleProperty('x') + getStyleProperty('width') / 2
  var y = getStyleProperty('y') + titleHeight + buttonHeight + (buttonHeight * currentIndex) - buttonHeight / 2

  drawRect(x, y, getStyleProperty('width'), buttonHeight, backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3])

	setTextParams(buttonFont, textColor, buttonScale, false, shadow)
	drawText(text, getStyleProperty('x') + buttonTextXOffset, y - (buttonHeight / 2) + buttonTextYOffset)

  if(subText) {
    setTextParams(buttonFont, subTextColor, buttonScale, false, shadow, true)
		drawText(subText, getStyleProperty('x') + buttonTextXOffset, y - buttonHeight / 2 + buttonTextYOffset)
  }
}

FX.CreateMenu = function(id, title, subTitle, style) {
  // Default settings
  var menu = { }

  // Members
  menu.id = id
  menu.previousMenu = null
  menu.aboutToBeClosed = false
  menu.currentOption = 1
  menu.title = title
  menu.subTitle = subTitle && subTitle.toUpperCase() || 'INTERACTION MENU'

  // Style
  if(style) {
    menu.style = style
  }

  menus[id] = menu
}

FX.CreateSubMenu = function(id, parent, subTitle, style) {
  	var parentMenu = menus[parent]
    if(!parentMenu) return

    FX.CreateMenu(id, parentMenu.title, subTitle && subTitle.toUpperCase() || parentMenu.subTitle)

    var menu = menus[id]

  	menu.previousMenu = parent

    if(parentMenu.overrideStyle) {
      	menu.overrideStyle = copyTable(parentMenu.overrideStyle)
    }

    if(style) {
      menu.style = style
    } else if(parentMenu.style) {
      menu.style = copyTable(parentMenu.style)
    }
}

FX.CurrentMenu = function() {
  return currentMenu && currentMenu.id || null
}

FX.OpenMenu = function(id) {
  if(id && menus[id]) {
    PlaySoundFrontend(-1, 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
		setMenuVisible(id, true)
  }
}

FX.IsMenuOpened = function(id) {
  return currentMenu && currentMenu.id == id
}

FX.Begin = FX.IsMenuOpened

FX.IsAnyMenuOpened = function() {
  return currentMenu !== null
}

FX.IsMenuAboutToBeClosed = function() {
  return currentMenu && currentMenu.aboutToBeClosed
}

FX.CloseMenu = function() {
  if(!currentMenu) return

  if(currentMenu.aboutToBeClosed) {
    currentMenu.aboutToBeClosed = false
    setMenuVisible(currentMenu.id, false)
    optionCount = 0
    currentKey = null
    PlaySoundFrontend(-1, 'QUIT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
  } else {
    currentMenu.aboutToBeClosed = true
  }
}

FX.ToolTip = function (text, width, flipHorizontal) {
  if(!currentMenu) return

  var currentIndex = getCurrentIndex()
  if(!currentIndex) return

  width = width || toolTipWidth

  var x = null

  if(!flipHorizontal) {
    	x = getStyleProperty('x') + getStyleProperty('width') + width / 2 + buttonTextXOffset
  } else {
    x = getStyleProperty('x') - width / 2 - buttonTextXOffset
  }

  var textX = x - (width / 2) + buttonTextXOffset

  setTextParams(buttonFont, getStyleProperty('textColor'), buttonScale, false, true, false, textX, textX + width - (buttonTextYOffset * 2))
  var linesCount = getLinesCount(text, textX, getStyleProperty('y'))

  var height = GetTextScaleHeight(buttonScale, buttonFont) * (linesCount + 1) + buttonTextYOffset
	var y = getStyleProperty('y') + titleHeight + (buttonHeight * currentIndex) + height / 2

  drawRect(x, y, width, height, getStyleProperty('backgroundColor'))

	y = y - (height / 2) + buttonTextYOffset
	drawText(text, textX, y)
}

FX.Button = function(text, subText) {
  if(!currentMenu) return

	optionCount = optionCount + 1

	drawButton(text, subText)

	var pressed = false

  if(currentMenu.currentOption === optionCount) {
    if(currentKey === keys.select) {
      pressed = true
      PlaySoundFrontend(-1, getStyleProperty('buttonPressedSound').name, getStyleProperty('buttonPressedSound').set, true)
    } else if(currentKey === keys.left || currentKey === keys.right) {
      	PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
    }
  }

  return pressed
}

FX.SpriteButton = function(text, dict, name, r, g, b, a) {
  if(!currentMenu) return

  var pressed = FX.Button(text)

	var currentIndex = getCurrentIndex()
  if(!currentIndex) return

  if(!HasStreamedTextureDictLoaded(dict)) {
    RequestStreamedTextureDict(dict)
  }
  DrawSprite(dict, name, getStyleProperty('x') + getStyleProperty('width') - spriteWidth / 2 - buttonSpriteXOffset, getStyleProperty('y') + titleHeight + buttonHeight + (buttonHeight * currentIndex) - spriteHeight / 2 + buttonSpriteYOffset, spriteWidth, spriteHeight, 0., r || 255, g || 255, b || 255, a || 255)

  return pressed
}

FX.InputButton = async function(text, windowTitleEntry, defaultText, maxLength, subText) {
  if(!currentMenu) return

  var pressed = FX.Button(text, subText)
	var inputText = null

  if(pressed) {
    DisplayOnscreenKeyboard(1, windowTitleEntry || 'FMMC_MPM_NA', '', defaultText || '', '', '', '', maxLength || 255)

    while(true) {
      DisableAllControlActions(0)
      var status = UpdateOnscreenKeyboard()
      if (status === 2) break
      else if(status === 1) {
        inputText = GetOnscreenKeyboardResult()
        break
      }
      await FX.Delay(0)
    }
  }

  return pressed, inputText
}

FX.MenuButton = function(text, id, subText) {
  if(!currentMenu) return
  var pressed = FX.Button(text, subText)

  if(pressed) {
    currentMenu.currentOption = optionCount
		setMenuVisible(currentMenu.id, false)
		setMenuVisible(id, true, true)
  }

  return pressed
}

FX.CheckBox = function (text, checked, callback) {
  if(!currentMenu) return

  var name = null
  if(currentMenu.currentOption === optionCount + 1) {
    name = checked && 'shop_box_tickb' || 'shop_box_blankb'
  } else {
    name = checked && 'shop_box_tick' || 'shop_box_blank'
  }

  var pressed = FX.SpriteButton(text, 'commonmenu', name)

  if(pressed) {
    checked = !checked
    if(callback) callback(checked)
  }

  return pressed
}

FX.ComboBox = function (text, items, currentIndex, selectedIndex, callback) {
  if(!currentMenu) return
  var itemsCount = items
  var selectedItem = items[currentIndex]
  var isCurrent = currentMenu.currentOption === optionCount + 1
  var selectedIndex = selectedIndex || currentIndex

  if(itemsCount > 1 && isCurrent) {
    selectedItem = '← ' + selectedItem.toString() + ' →'
  }

  var pressed = FX.Button(text, selectedItem)

  if(pressed) {
    selectedIndex = currentIndex
  } else if(isCurrent) {
    if(currentKey === keys.left) {
      if(currentIndex > 1) currentIndex = currentIndex -1
      else currentIndex = itemsCount
    } else if(currentKey === keys.right) {
      if(currentIndex < itemsCount) currentIndex = currentIndex + 1
      else currentIndex = 1
    }
  }

  if(callback) callback(currentIndex, selectedIndex)

  return pressed, currentIndex
}

FX.Display = function() {
  if(currentMenu) {
    DisableControlAction(0, keys.left, true)
    DisableControlAction(0, keys.up, true)
    DisableControlAction(0, keys.down, true)
    DisableControlAction(0, keys.right, true)
    DisableControlAction(0, keys.back, true)
  }

  if(currentMenu.aboutToBeClosed) {
    FX.CloseMenu()
  } else {
    ClearAllHelpMessages()

    drawTitle()
    drawSubTitle()

    currentKey = null

    if(IsDisabledControlJustReleased(0, keys.down)) {
      PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
      if(currentMenu.currentOption < optionCount) {
        currentMenu.currentOption = currentMenu.currentOption + 1
      } else {
        currentMenu.currentOption = 1
      }
    } else if (IsDisabledControlJustReleased(0, keys.up)) {
      PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)

      if(currentMenu.currentOption > 1) {
        currentMenu.currentOption = currentMenu.currentOption - 1
      } else {
        currentMenu.currentOption = optionCount
      }
    } else if( IsDisabledControlJustReleased(0, keys.left) ) {
      currentKey = keys.left
    } else if (IsDisabledControlJustReleased(0, keys.right)) {
      currentKey = keys.right
    } else if(IsControlJustReleased(0, keys.select)) {
      currentKey = keys.select
    } else if(IsDisabledControlJustReleased(0, keys.back)) {
      if(menus[currentMenu.previousMenu]) {
        setMenuVisible(currentMenu.previousMenu, true)
        PlaySoundFrontend(-1, 'BACK', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
      } else {
        FX.CloseMenu()
      }
    }
    optionCount = 0
  }
}

FX.End = FX.Display

FX.CurrentOption = function() {
  if(currentMenu && optionCount !== 0) return currentMenu.currentOption
  return null
}

FX.IsItemHovered = function() {
  if(!currentMenu || optionCount === 0) return false
  return currentMenu.currentOption === optionCount
}

FX.IsItemSelected = function() {
  return currentKey == keys.select && FX.IsItemHovered()
}

FX.SetTitle = function(id, title) {
  setMenuProperty(id, 'title', title)
}

FX.SetMenuTitle = FX.SetTitle

FX.SetSubTitle = function(id, text) {
  setMenuProperty(id, 'subTitle', text.toUpperCase())
}

FX.SetMenuSubTitle = FX.SetSubTitle

FX.SetMenuStyle = function(id, style) {
  setMenuProperty(id, 'style', style)
}

FX.SetMenuX = function(id, x) {
  setStyleProperty(id, 'x', x)
}

FX.SetMenuY = function(id, y) {
  setStyleProperty(id, 'y', y)
}

FX.SetMenuWidth = function(id, width) {
  setStyleProperty(id, 'width', width)
}

FX.SetMenuMaxOptionCountOnScreen = function(id, count) {
  setStyleProperty(id, 'maxOptionCountOnScreen', count)
}

FX.SetTitleColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'titleColor', [r, g, b, a ])
}

FX.SetMenuTitleColor = FX.SetTitleColor

FX.SetMenuSubTitleColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'subTitleColor', [ r, g, b, a ])
}

FX.SetTitleBackgroundColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'titleBackgroundColor', [ r, g, b, a ])
}

FX.SetMenuTitleBackgroundColor = FX.SetTitleBackgroundColor

FX.SetTitleBackgroundSprite = function(id, dict, name) {
  RequestStreamedTextureDict(dict)
  setStyleProperty(id, 'titleBackgroundSprite', { dict : dict, name : name })
}

FX.SetMenuTitleBackgroundSprite = FX.SetTitleBackgroundSprite

FX.SetMenuBackgroundColor = function (id, r, g, b, a) {
  setStyleProperty(id, 'backgroundColor', [ r, g, b, a ])
}

FX.SetMenuTextColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'textColor', [ r, g, b, a ])
}

FX.SetMenuSubTextColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'subTextColor', [ r, g, b, a ])
}

FX.SetMenuFocusColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'focusColor', [ r, g, b, a ])
}

FX.SetMenuFocusTextColor = function(id, r, g, b, a) {
  setStyleProperty(id, 'focusTextColor', [ r, g, b, a ])
}

FX.SetMenuButtonPressedSound = function(id, name, set) {
  setStyleProperty(id, 'buttonPressedSound', { name : name, set : set })
}

FX.Delay = function(ms) { //Use this function instead of Wait()
    return new Promise((res) => {
        setTimeout(res, ms)
    })
}


// Menu
var _altX = false
var _altY = false
var _altWidth = false
var _altTitle = false
var _altSubTitle = false
var _altMaxOption = false

// Controls
var _inputText = null

var _altSprite = false

var _comboBoxItems = [ 'F', 'I', 'V', 'E', 'M' ]
var _comboBoxIndex = 1

var _checked = false

FX.CreateMenu('demo', 'Demo Menu', 'Thank you for using FX')

FX.CreateSubMenu('demo_menu', 'demo', 'Menu')
FX.CreateSubMenu('demo_controls', 'demo', 'Controls')
FX.CreateSubMenu('demo_style', 'demo', 'Style')
FX.CreateSubMenu('demo_exit', 'demo', 'Are you sure?')


//if(FX.IsAnyMenuOpened()) return

FX.OpenMenu('demo')


const mainMenu = FX.CurrentMenu()

// Menu Settings


const MenuInstance = setTick(async () => {
  console.log("I'm running.");

  while(true) {
    if(FX.Begin('demo')) {
      FX.MenuButton('Menu', 'demo_menu')
      FX.MenuButton('Controls', 'demo_controls')
      FX.MenuButton('Style', 'demo_style')
      FX.MenuButton('Exit', 'demo_exit')

      FX.End()
    } else if(FX.Begin('demo_menu')) {
      FX.End()
    } else if(FX.Begin('demo_controls')) {
      FX.Button('Button', 'Subtext')

      var pressed, inputText = FX.InputButton('Input Button', null, _inputText)
      if(pressed) {
        if(inputText) {
          _inputText = inputText
        }
      }

      if(FX.SpriteButton('Sprite Button', 'commonmenu', _altSprite && 'shop_gunclub_icon_b' || 'shop_garage_icon_b')) {

      }
      FX.Button('Single Line Tooltip')
      if(FX.IsItemHovered()) {
        FX.ToolTip('This is single line tooltip.')
      }

      FX.Button('Multiline Tooltip')
      if(FX.IsItemHovered()) {
        FX.ToolTip('This is long enough multiline tooltip to test it.')
      }

      if(FX.CheckBox('Checkbox', _checked)) {
        _checked = !_checked
      }

      var _, comboBoxIndex = FX.ComboBox('Combobox', _comboBoxItems, _comboBoxIndex)
      if( _comboBoxIndex !== comboBoxIndex ) {
        _comboBoxIndex = comboBoxIndex
      }

      FX.End()
    } else if(FX.Begin('demo_style')) {
      FX.End()
    } else if(FX.Begin('demo_exit')) {
      FX.MenuButton('No', 'demo')
      if(FX.Button('~r~Yes')) {
        FX.CloseMenu()
      }
      FX.End()
    }
    await FX.Delay(0)
  }

});
