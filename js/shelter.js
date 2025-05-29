var key = [2815074099, 1725469378, 4039046167, 874293617, 3063605751, 3133984764, 4097598161, 3620741625];
var iv = sjcl.codec.hex.toBits("7475383967656A693334307438397532");
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
var isLoaded = false;

function colorHack() {
  $('.jscolor').each(function () {
    $(this).focus();
  });

  $("input").blur();
}

function colorConverter(colorhex, mode) {
  var mode = ((mode === undefined) ? false : mode);
  if (mode) {

    var hexColor = colorhex.toString(16).substring(2).toUpperCase();
    return hexColor;
  }
  else {
    var colorfos;
    var x = colorhex.substring(0, 0) + "FF" + colorhex.substring(0);
    colorfos = parseInt(x, 16);
    return colorfos;
  }
}

//lazy code addition, but I believe it is beneficial and not too invasive.
function numberCheckHelper() {
  $("input[type='number']").each(function () {
    if ($(this).val === undefined || $(this).val().trim().length == 0 || $(this).val() == null) {
      var a = $(this).attr("min");
      if (a === undefined) a = 0;
      $(this).val(a);
    }
  });
  setTimeout(numberCheckHelper, 3000);
}

function colortofos() {
  var colorhex = document.getElementsByClassName("jscolor")[0].value;
  $(".value1").html(colorConverter(colorhex));
}

$(document).ready(function () {
  numberCheckHelper();
  if (window.location.href.indexOf("?preset=") > -1 && window.location.href.indexOf("?savename=") > -1) {
    urlPreset = window.location.href.substring(window.location.href.indexOf("?preset=") + 8, window.location.href.indexOf("?savename="));
    urlSaveName = window.location.href.substring(window.location.href.indexOf("?savename=") + 10);
    preset(urlPreset, urlSaveName);
  }
});

function handleFileSelect(evt) {
  try {
    evt.stopPropagation();
    evt.preventDefault();
    var f = evt.target.files[0];
    var fileName = f.name;
    if (f.size > 3e7) {
      throw "文件最大限制为 30MB"
    }
    if (f) {
      var reader = new FileReader;
      if (evt.target.id == "sav_file") {
        reader.onload = function (evt2) {
          try {
            decrypt(evt2, fileName, reader.result)
          } catch (e) {
            alert("Error: " + e)
          }
        };
        reader.readAsText(f)
      } else if (evt.target.id == "json_file") {
        reader.onload = function (evt2) {
          try {
            encrypt(evt2, fileName, reader.result)
          } catch (e) {
            alert("Error: " + e)
          }
        };
        reader.readAsText(f)
      }
    }
  } catch (e) {
    alert("Error: " + e)
  } finally {
    evt.target.value = null
  }
}

function decrypt(evt, fileName, base64Str) {
  var cipherBits = sjcl.codec.base64.toBits(base64Str);
  var prp = new sjcl.cipher.aes(key);
  var plainBits = sjcl.mode.cbc.decrypt(prp, cipherBits, iv);
  var jsonStr = sjcl.codec.utf8String.fromBits(plainBits);
  try {
    document.getElementById("presetSaveName").value = fileName;
    edit(fileName, JSON.parse(jsonStr));
  } catch (e) {
    throw "解码文件不包含有效JSON：" + e
  }
}

function encrypt(fileName, save) {
  var compactJsonStr = JSON.stringify(save);
  var plainBits = sjcl.codec.utf8String.toBits(compactJsonStr);
  var prp = new sjcl.cipher.aes(key);
  var cipherBits = sjcl.mode.cbc.encrypt(prp, plainBits, iv);
  var base64Str = sjcl.codec.base64.fromBits(cipherBits);
  var blob = new Blob([base64Str], {
    type: "text/plain"
  });
  saveAs(blob, fileName.replace(".txt", ".sav").replace(".json", ".sav"))
}

document.getElementById("sav_file").addEventListener("change", function (e) {
  $('.box').removeClass('hover').addClass('ready');
  $('.instructions').hide();
  handleFileSelect(e);
}, false);

document.ondragover = document.ondrop = function (e) {
  e.preventDefault();
  return false;
};

$('body .container .box')
  .on('dragover', function (e) {
    $('.box').addClass('hover');
    $('.instructions').hide();
  })
  .on('dragleave', function (e) {
    $('.box').removeClass('hover');
    $('.instructions').show();
  })
  .on('drop', function (e) {
    $('.box').removeClass('hover').addClass('ready');
    $('.instructions').hide();
    var file = e.originalEvent.dataTransfer.files[0],
      fileName = file.name,
      reader = new FileReader();
    reader.onload = function (ev) {
      try {
        decrypt(ev, fileName, reader.result);
      } catch (err) {
        alert("Error: " + err);
      }
    };
    reader.readAsText(file);
    e.preventDefault();
    return false;
  });


// Modifications
function edit(fileName, save) {
  isLoaded = true;
  var scope = angular.element($('body').get(0)).scope();
  scope.$apply(function () {
    scope.save = save;
    scope.fileName = fileName;
  });
}

var app = angular.module('shelter', []);

app.controller('dwellerController', function ($scope) {
  $scope.section = 'vault';

  $scope.fileName = '';
  $scope.dweller = {};
  $scope.statsName = ['Unknown', 'S.', 'P.', 'E.', 'C.', 'I.', 'A.', 'L.'];
  $scope.other = {};
  $scope.wastelandTeams = [];
  $scope.wastelandTeams2 = [];
  $scope.team = {};
  $scope.actor = {};

  var _save = {},
    _lunchboxCount = 0,
    _handyCount = 0,
    _petCarrierCount = 0,
    _starterPackCount = 0,
    _vaultName = -1,
    _skinColor = null,
    _hairColor = null,
    _firstName = null,
    _otherName = null;

  Object.defineProperty($scope, 'firstName', {
    get: function () {
      return _firstName
    },
    set: function (val) {
      _firstName = val;
      if (val.trim().length == 0) {
        $scope.dweller.name = "避难所居民";
      }
      else {
        $scope.dweller.name = val;
      }
    }
  });

  Object.defineProperty($scope, 'otherName', {
    get: function () {
      return _otherName
    },
    set: function (val) {
      _otherName = val;
      if (val.trim().length == 0) {
        $scope.other.name = "其他避难所";
      }
      else {
        $scope.other.name = val;
      }
    }
  });

  Object.defineProperty($scope, 'vaultName', {
    get: function () {
      if (_vaultName == -1 && $scope.save !== undefined && $scope.save.vault !== undefined) _vaultName = parseInt($scope.save.vault.VaultName);
      return _vaultName
    },
    set: function (val) {
      if (val == null) val = 0;
      _vaultName = val;
      var str = "" + val;
      while (str.length < 3) str = "0" + str;
      $scope.save.vault.VaultName = str;
    }
  });

  Object.defineProperty($scope, 'skinColor', {
    get: function () {
      return _skinColor
    },
    set: function (val) {
      _skinColor = val;
      $scope.dweller.skinColor = colorConverter(val);
    }
  });

  Object.defineProperty($scope, 'hairColor', {
    get: function () {
      return _hairColor
    },
    set: function (val) {
      _hairColor = val;
      $scope.dweller.hairColor = colorConverter(val);
    }
  });

  Object.defineProperty($scope, 'save', {
    get: function () {
      return _save
    },
    set: function (val) {
      _save = val;
      extractCount();
      extractTeams();
    }
  });

  Object.defineProperty($scope, 'lunchboxCount', {
    get: function () {
      return _lunchboxCount
    },
    set: function (val) {
      _lunchboxCount = val;
      updateCount();
    }
  });

  Object.defineProperty($scope, 'handyCount', {
    get: function () {
      return _handyCount
    },
    set: function (val) {
      _handyCount = val;
      updateCount();
    }
  });

  Object.defineProperty($scope, 'petCarrierCount', {
    get: function () {
      return _petCarrierCount
    },
    set: function (val) {
      _petCarrierCount = val;
      updateCount();
    }
  });

  Object.defineProperty($scope, 'starterPackCount', {
    get: function () {
      return _starterPackCount
    },
    set: function (val) {
      _starterPackCount = val;
      updateCount();
    }
  });

  Object.defineProperty($scope, 'elapsedTimeAliveExploring', {
    get: function () {
      return $scope.team.elapsedTimeAliveExploring;
    },
    set: function (val) {
      $scope.team.elapsedTimeAliveExploring = val;
      updateTeam();
    }
  });

  Object.defineProperty($scope, 'returnTripDuration', {
    get: function () {
      return $scope.team.returnTripDuration;
    },
    set: function (val) {
      $scope.team.returnTripDuration = val;
      updateTeam();
    }
  });

  Object.defineProperty($scope, 'teamEquipment', {
    get: function () {
      return $scope.team.teamEquipment;
    },
    set: function (val) {
      $scope.team.teamEquipment = val;
      updateTeam();
    }
  });


  $scope.editDweller = function (dweller) {
    $scope.dweller = dweller;
    _firstName = $scope.dweller.name;
    _skinColor = colorConverter($scope.dweller.skinColor, true);
    _hairColor = colorConverter($scope.dweller.hairColor, true);
    setTimeout(colorHack, 200);
  };

  $scope.editOthers = function (other) {
    $scope.other = other;
    _otherName = $scope.other.name;
  };

  $scope.maxhappinessAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for (i = 0; i < sum2; i++)
      $scope.save.dwellers.dwellers[i].happiness.happinessValue = 100;
    alert("已最大化全部居住者的幸福度！");
  };

  $scope.healAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for (i = 0; i < sum2; i++) {
      $scope.save.dwellers.dwellers[i].health.radiationValue = 0;
      $scope.save.dwellers.dwellers[i].health.healthValue = $scope.save.dwellers.dwellers[i].health.maxHealth;
    }
    alert("已治愈全部居住者！");
  };

  $scope.maxSpecialAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for (i = 0; i < sum2; i++)
      for (i2 = 0; i2 < 8; i2++)
        $scope.save.dwellers.dwellers[i].stats.stats[i2].value = 10;
    alert("已最大化全部居住者的属性！");
  };

  $scope.maxSpecial = function () {
    $scope.dweller.stats.stats[1].value = 10;
    $scope.dweller.stats.stats[2].value = 10;
    $scope.dweller.stats.stats[3].value = 10;
    $scope.dweller.stats.stats[4].value = 10;
    $scope.dweller.stats.stats[5].value = 10;
    $scope.dweller.stats.stats[6].value = 10;
    $scope.dweller.stats.stats[7].value = 10;
  };

  $scope.removeRocks = function () {
    $scope.save.vault.rocks = [];
    alert("已移除全部石头！");
  };

  $scope.closeDweller = function (dweller) {
    $scope.dweller = {};
  };

  $scope.editTeam = function (team) {
    $scope.team = team;
  };

  $scope.closeTeam = function () {
    $scope.team = {};
  };

  $scope.closeOther = function () {
    $scope.other = {};
  };

  $scope.download = function () {
    encrypt(document.getElementById("presetSaveName").value, $scope.save);
  };

  $scope.clearemergency = function () {
    var sum2 = Object.keys($scope.save.vault.rooms).length;
    for (i = 0; i < sum2; i++) {
      $scope.save.vault.rooms[i].currentStateName = "Idle";
    }
    alert("已清除全部房间的紧急情况！");
  };

  $scope.acceptdwellersWaiting = function () {
    $scope.save.dwellerSpawner.dwellersWaiting = [];
    alert("已接受全部在等待的居住者！");
  };

  $scope.unlockthemes = function () {
    var sum2 = Object.keys($scope.save.survivalW.collectedThemes.themeList).length;
    for (i = 0; i < sum2; i++) {
      $scope.save.survivalW.collectedThemes.themeList[i].extraData.partsCollectedCount = 9;
      $scope.save.survivalW.collectedThemes.themeList[i].extraData.IsNew = true;
    }
    alert("已解锁全部主题！");
  };

  $scope.colortofos = colortofos;

  $scope.unlockrooms = function () {
    $scope.save.unlockableMgr.objectivesInProgress = [];
    $scope.save.unlockableMgr.completed = [];
    $scope.save.unlockableMgr.claimed = [
      "StorageUnlock",
      "MedbayUnlock",
      "SciencelabUnlock",
      "OverseerUnlock",
      "RadioStationUnlock",
      "WeaponFactoryUnlock",
      "GymUnlock",
      "DojoUnlock",
      "ArmoryUnlock",
      "ClassUnlock",
      "OutfitFactoryUnlock",
      "CardioUnlock",
      "BarUnlock",
      "GameRoomUnlock",
      "BarberShopUnlock",
      "PowerPlantUnlock",
      "WaterroomUnlock",
      "HydroponicUnlock",
      "NukacolaUnlock",
      "DesignFactoryUnlock"];
    alert("已解锁全部房间！");
  };

  $scope.unlockrecipes = function () {
    $scope.save.survivalW.recipes = [
      "Shotgun_Rusty",
      "Railgun",
      "LaserPistol_Focused",
      "PlasmaThrower_Boosted",
      "PlasmaThrower_Overcharged",
      "PipePistol_LittleBrother",
      "CombatShotgun_Hardened",
      "Flamer_Rusty",
      "LaserRifle_Tuned",
      "HuntingRifle_OlPainless",
      "PlasmaRifle_Focused",
      "PipeRifle",
      "JunkJet_Tactical",
      "InstitutePistol_Improved",
      "BBGun_RedRocket",
      "032Pistol_Hardened",
      "InstitutePistol_Apotheosis",
      "InstitutePistol_Scattered",
      "InstituteRifle_Excited",
      "PipeRifle_Long",
      "GatlingLaser",
      "PlasmaThrower_DragonsMaw",
      "PlasmaRifle",
      "AssaultRifle_Rusty",
      "AlienBlaster_Destabilizer",
      "Fatman_Guided",
      "Melee_RaiderSword",
      "SniperRifle_Hardened",
      "Melee_BaseballBat",
      "PlasmaRifle_MeanGreenMonster",
      "032Pistol_WildBillsSidearm",
      "GaussRifle",
      "LaserRifle_WaserWifle",
      "InstitutePistol_Scoped",
      "Flamer_Pressurized",
      "AssaultRifle_ArmorPiercing",
      "Railgun_Rusty",
      "Minigun_Hardened",
      "InstituteRifle_VirgilsRifle",
      "JunkJet_Electrified",
      "Flamer_Hardened",
      "GatlingLaser_Focused",
      "Magnum_Hardened",
      "Railgun_Railmaster",
      "Melee_PoolCue",
      "Minigun_Enhanced",
      "GaussRifle_Rusty",
      "JunkJet_RecoilCompensated",
      "Pistol_LoneWanderer",
      "MissilLauncher",
      "LaserPistol",
      "InstitutePistol_Incendiary",
      "BBGun_ArmorPiercing",
      "Rifle_ArmorPiercing",
      "AssaultRifle_Enhanced",
      "LaserRifle_Rusty",
      "CombatShotgun",
      "GatlingLaser_Tuned",
      "SawedOffShotgun_Hardened",
      "PlasmaThrower_Agitated",
      "Magnum_Blackhawk",
      "AssaultRifle_Infiltrator",
      "PlasmaPistol_MPLXNovasurge",
      "HuntingRifle_ArmorPiercing",
      "Railgun_Enhanced",
      "SniperRifle_Enhanced",
      "GaussRifle_Accelerated",
      "PlasmaThrower_Tactical",
      "CombatShotgun_Rusty",
      "PipeRifle_Bayoneted",
      "GaussRifle_Hardened",
      "PlasmaThrower",
      "AlienBlaster_Focused",
      "SawedOffShotgun_Kneecapper",
      "Flamer_Enhanced",
      "Railgun_Hardened",
      "GaussRifle_Magnetro4000",
      "PipePistol_Auto",
      "SniperRifle_ArmorPiercing",
      "PipeRifle_NightVision",
      "MissilLauncher_Enhanced",
      "PipeRifle_Calibrated",
      "LaserMusket",
      "Rifle_Hardened",
      "Fatman_Enhanced",
      "JunkJet",
      "PlasmaRifle_Amplified",
      "Minigun_Rusty",
      "Melee_FireHydrantBat",
      "GatlingLaser_Amplified",
      "JunkJet_Flaming",
      "Shotgun_DoubleBarrelled",
      "LaserPistol_Amplified",
      "AlienBlaster_Amplified",
      "InstituteRifle_NightVision",
      "SniperRifle_VictoryRifle",
      "PlasmaPistol",
      "Minigun_LeadBelcher",
      "Melee_ButcherKnife",
      "AssaultRifle",
      "Shotgun_Hardened",
      "MissilLauncher_Hardened",
      "LaserRifle_Focused",
      "AlienBlaster",
      "Melee_Pickaxe",
      "032Pistol_ArmorPiercing",
      "SniperRifle",
      "Pistol_ArmorPiercing",
      "PlasmaPistol_Tuned",
      "Melee_KitchenKnife",
      "AssaultRifle_Hardened",
      "Fatman_Hardened",
      "Shotgun_FarmersDaughter",
      "CombatShotgun_CharonsShotgun",
      "AlienBlaster_Rusty",
      "GatlingLaser_Vengeance",
      "InstituteRifle_Long",
      "JunkJet_TechniciansRevenge",
      "LaserPistol_SmugglersEnd",
      "Flamer_Burnmaster",
      "SniperRifle_Rusty",
      "InstituteRifle",
      "MissilLauncher_MissLauncher",
      "InstituteRifle_Targeting",
      "Fatman_Rusty",
      "Rifle_LincolnsRepeater",
      "PipeRifle_BigSister",
      "Fatman",
      "GatlingLaser_Rusty",
      "Fatman_Mirv",
      "PlasmaPistol_Focused",
      "Shotgun_Enhanced",
      "PipePistol_Scoped",
      "Minigun",
      "InstitutePistol",
      "ProfessorSpecial",
      "PiperSpecial",
      "AllNightware_Lucky",
      "KnightSpecial",
      "BowlingShirt",
      "HunterGear_Bounty",
      "BattleArmor_Sturdy",
      "ColonelSpecial",
      "UtilityJumpsuit_Sturdy",
      "DooWopOutfit",
      "PowerArmor_51f",
      "PowerArmor_MkVI",
      "PowerArmor_51d",
      "PowerArmor_51a",
      "BishopSpecial",
      "FlightSuit_Advanced",
      "SodaFountainDress",
      "HandymanJumpsuit_Expert",
      "HandymanJumpsuit_Advanced",
      "GreaserSpecial",
      "ThreedogSpecial",
      "WastelandSurgeon_Doctor",
      "PowerArmor_T45f",
      "CromwellSpecial",
      "PowerArmor_T45d",
      "WandererArmor_Sturdy",
      "LifeguardOutfit",
      "WrestlerSpecial",
      "EngineerSpecial",
      "MilitaryJumpsuit_Officer",
      "PrestonSpecial",
      "HazmatSuit_Heavy",
      "CombatArmor_Heavy",
      "RaiderArmor_Sturdy",
      "SlasherSpecial",
      "AlistairSpecial",
      "SurvivorSpecial",
      "AllNightware_Naughty",
      "InstituteJumper_Advanced",
      "SurgeonSpecial",
      "MayorSpecial",
      "RiotGear_Sturdy",
      "ScifiSpecial",
      "MetalArmor_Sturdy",
      "BOSUniform",
      "SynthArmor_Heavy",
      "Vest",
      "BittercupSpecial",
      "SoldierSpecial",
      "UtilityJumpsuit_Heavy",
      "HunterGear_Mutant",
      "AbrahamSpecial",
      "EulogyJonesSpecial",
      "PowerArmor_MkIV",
      "BaseballUniform",
      "PowerArmor_T60a",
      "PowerArmor_T60d",
      "FormalWear_Lucky",
      "PowerArmor_T60f",
      "Swimsuit",
      "LabCoat_Expert",
      "LabCoat_Advanced",
      "EmpressSpecial",
      "LibrarianSpecial",
      "KingSpecial",
      "MilitaryJumpsuit_Commander",
      "ScribeRobe",
      "BOSUniform_Expert",
      "LucasSpecial",
      "PrinceSpecial",
      "WandererArmor_Heavy",
      "RadiationSuit_Expert",
      "ScientistScrubs_Commander",
      "HazmatSuit_Sturdy",
      "MetalArmor_Heavy",
      "ButchSpecial",
      "ComedianSpecial",
      "RaiderArmor_Heavy",
      "FlightSuit_Expert",
      "SportsfanSpecial",
      "RothchildSpecial",
      "LabCoat",
      "BattleArmor",
      "BattleArmor_Heavy",
      "CombatArmor",
      "CombatArmor_Sturdy",
      "WandererArmor",
      "RaiderArmor",
      "WastelandSurgeon",
      "HunterGear_Treasure",
      "RiotGear",
      "RiotGear_Heavy",
      "SequinDress",
      "WastelandSurgeon_Settler",
      "HandymanJumpsuit",
      "MechanicJumpsuit",
      "InstituteJumper_Expert",
      "UtilityJumpsuit",
      "AllNightware",
      "WorkDress",
      "MilitaryJumpsuit",
      "FormalWear",
      "FormalWear_Fancy",
      "CheckeredShirt",
      "SweaterVest",
      "PowerArmor",
      "PowerArmor_MkI",
      "ScribeRobe_Initiate",
      "ScribeRobe_Elder",
      "RadiationSuit_Advanced",
      "RadiationSuit",
      "MoviefanSpecial",
      "NinjaSuit",
      "FlightSuit",
      "HazmatSuit",
      "BOSUniform_Advanced",
      "ScientistScrubs_Officer",
      "ScientistScrubs",
      "PolkaDotDress",
      "032Pistol",
      "032Pistol_Enhanced",
      "032Pistol_Rusty",
      "AlienBlaster_Tuned",
      "BBGun",
      "BBGun_Enhanced",
      "BBGun_Hardened",
      "BBGun_Rusty",
      "CombatShotgun_DoubleBarrelled",
      "CombatShotgun_Enhanced",
      "Flamer",
      "GaussRifle_Enhanced",
      "HuntingRifle",
      "HuntingRifle_Enhanced",
      "HuntingRifle_Hardened",
      "HuntingRifle_Rusty",
      "LaserPistol_Rusty",
      "LaserPistol_Tuned",
      "LaserRifle",
      "LaserRifle_Amplified",
      "Magnum",
      "Magnum_ArmorPiercing",
      "Magnum_Enhanced",
      "Magnum_Rusty",
      "Minigun_ArmorPiercing",
      "MissilLauncher_Guided",
      "MissilLauncher_Rusty",
      "PipePistol",
      "PipePistol_HairTrigger",
      "PipePistol_Heavy",
      "Pistol",
      "Pistol_Enhanced",
      "Pistol_Hardened",
      "Pistol_Rusty",
      "PlasmaPistol_Amplified",
      "PlasmaPistol_Rusty",
      "PlasmaRifle_Rusty",
      "PlasmaRifle_Tuned",
      "Railgun_Accelerated",
      "Rifle",
      "Rifle_Enhanced",
      "Rifle_Rusty",
      "SawedOffShotgun",
      "SawedOffShotgun_DoubleBarrelled",
      "SawedOffShotgun_Enhanced",
      "SawedOffShotgun_Rusty",
      "Shotgun"];
    alert("已解锁全部蓝图！");
  }

  function extractCount() {
    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("0") > -1) {
      _lunchboxCount = $scope.save.vault.LunchBoxesByType.toString().match(/0/g).length;
    } else {
      _lunchboxCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("1") > -1) {
      _handyCount = $scope.save.vault.LunchBoxesByType.toString().match(/1/g).length;
    } else {
      _handyCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("2") > -1) {
      _petCarrierCount = $scope.save.vault.LunchBoxesByType.toString().match(/2/g).length;
    } else {
      _petCarrierCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("3") > -1) {
      _starterPackCount = $scope.save.vault.LunchBoxesByType.toString().match(/3/g).length;
    } else {
      _starterPackCount = 0;
    }

    $scope.lunchboxCount = _lunchboxCount;
    $scope.handyCount = _handyCount;
    $scope.petCarrierCount = _petCarrierCount;
    $scope.starterPackCount = _starterPackCount;
  }

  function updateCount() {
    var types = $scope.save.vault.LunchBoxesByType = [],
      count = $scope.save.vault.LunchBoxesCount = _lunchboxCount + _handyCount + _petCarrierCount + _starterPackCount;

    for (var i = 0; i < _lunchboxCount; i++) {
      types.push(0);
    }

    for (var i = 0; i < _handyCount; i++) {
      types.push(1);
    }

    for (var i = 0; i < _petCarrierCount; i++) {
      types.push(2);
    }

    for (var i = 0; i < _starterPackCount; i++) {
      types.push(3);
    }
  }

  function extractTeams() {
    $scope.save.vault.wasteland.teams.forEach(function (team) {
      $scope.wastelandTeams.push({
        teamIndex: team.teamIndex,
        dweller: findDweller(team.dwellers[0]),
        elapsedTimeAliveExploring: team.elapsedTimeAliveExploring,
        returnTripDuration: team.returnTripDuration,
        teamEquipment: team.teamEquipment
      });
      $scope.wastelandTeams2.push({
        teamIndex: team.teamIndex,
        actor: findActor(team.actors[0]),
        elapsedTimeAliveExploring: team.elapsedTimeAliveExploring,
        returnTripDuration: team.returnTripDuration,
        teamEquipment: team.teamEquipment
      });
    });
  }

  function findDweller(id) {
    var dweller = null;
    $scope.save.dwellers.dwellers.forEach(function (d) {
      if (d.serializeId == id) {
        dweller = d;
      }
    });
    return dweller;
  }

  function findActor(id) {
    var actor = null;
    $scope.save.dwellers.actors.forEach(function (d) {
      if (d.serializeId == id) {
        actor = d;
      }
    });
    return actor;
  }

  function updateTeam() {
    $scope.save.vault.wasteland.teams.forEach(function (team) {
      if (team.teamIndex == $scope.team.teamIndex) {
        team.elapsedTimeAliveExploring = $scope.team.elapsedTimeAliveExploring;
        team.returnTripDuration = $scope.team.returnTripDuration;
        team.teamEquipment = $scope.team.teamEquipment;
      }
    });
  }

  $scope.dwellerweaponlist = {
    "032Pistol": ".32 手枪",
    "Pistol": "10mm 手枪",
    "GaussRifle_Accelerated": "加速型高斯步枪",
    "Railgun_Accelerated": "加速型轨道步枪",
    "PlasmaThrower_Agitated": "不稳定型等离子抛射器",
    "AlienBlaster": "外星冲击枪",
    "AmataPistol": "阿玛塔手枪",
    "AlienBlaster_Amplified": "增强型外星冲击枪",
    "GatlingLaser_Amplified": "增强型加特林激光枪",
    "LaserPistol_Amplified": "增强型激光手枪",
    "LaserRifle_Amplified": "增强型激光步枪",
    "PlasmaPistol_Amplified": "增强型等离子手枪",
    "PlasmaRifle_Amplified": "增强型等离子步枪",
    "InstitutePistol_Apotheosis": "终极学院手枪",
    "032Pistol_ArmorPiercing": "穿甲型 .32 手枪",
    "Pistol_ArmorPiercing": "穿甲型 10mm 手枪",
    "AssaultRifle_ArmorPiercing": "穿甲型突击步枪",
    "BBGun_ArmorPiercing": "穿甲型BB 枪",
    "HuntingRifle_ArmorPiercing": "穿甲型狩猎步枪",
    "Rifle_ArmorPiercing": "穿甲型杠杆步枪",
    "Minigun_ArmorPiercing": "穿甲型迷你枪",
    "Magnum_ArmorPiercing": "穿甲型狙击.44 手枪",
    "SniperRifle_ArmorPiercing": "穿甲型狙击步枪",
    "AssaultRifle": "突击步枪",
    "PipePistol_Auto": "自动管状手枪",
    "Melee_BaseballBat": "棒球棍",
    "PipeRifle_Bayoneted": "刺刀管状步枪",
    "BBGun": "BB 枪",
    "PipeRifle_BigSister": "大姐",
    "Magnum_Blackhawk": "黑鹰手枪",
    "PlasmaThrower_Boosted": "强化型等离子抛射器",
    "Flamer_Burnmaster": "灼烧大师喷火器",
    "Melee_ButcherKnife": "屠刀",
    "PipeRifle_Calibrated": "校准型管状步枪",
    "CombatShotgun_CharonsShotgun": "卡戎霰弹枪",
    "CombatShotgun": "战斗霰弹枪",
    "AlienBlaster_Destabilizer": "破坏者冲击枪",
    "CombatShotgun_DoubleBarrelled": "双管战斗霰弹枪",
    "SawedOffShotgun_DoubleBarrelled": "双管锯短霰弹枪",
    "Shotgun_DoubleBarrelled": "双管霰弹枪",
    "PlasmaThrower_DragonsMaw": "龙之咆哮抛射器",
    "JunkJet_Electrified": "带电垃圾喷射机",
    "032Pistol_Enhanced": "强化型 .32 手枪",
    "Pistol_Enhanced": "强化型 10mm 手枪",
    "AssaultRifle_Enhanced": "强化型突击步枪",
    "BBGun_Enhanced": "强化型BB 枪",
    "CombatShotgun_Enhanced": "强化型战斗霰弹枪",
    "Fatman_Enhanced": "强化型胖子",
    "Flamer_Enhanced": "强化型喷火器",
    "GaussRifle_Enhanced": "强化型高斯步枪",
    "HuntingRifle_Enhanced": "强化型狩猎步枪",
    "Rifle_Enhanced": "强化型杠杆步枪",
    "Minigun_Enhanced": "强化型迷你枪",
    "MissilLauncher_Enhanced": "强化型导弹发射器",
    "Railgun_Enhanced": "强化型轨道步枪",
    "SawedOffShotgun_Enhanced": "强化型锯短霰弹枪",
    "Magnum_Enhanced": "强化型狙击.44 手枪",
    "Shotgun_Enhanced": "强化型霰弹枪",
    "SniperRifle_Enhanced": "强化型狙击步枪",
    "InstituteRifle_Excited": "激励型学院步枪",
    "Shotgun_FarmersDaughter": "农夫的女儿霰弹枪",
    "Fatman": "胖子",
    "Melee_FireHydrantBat": "消防栓棍棒",
    "Fist": "拳头",
    "Flamer": "喷火器",
    "JunkJet_Flaming": "燃烧型垃圾喷射机",
    "AlienBlaster_Focused": "聚焦型外星冲击枪",
    "GatlingLaser_Focused": "聚焦型加特林激光枪",
    "LaserPistol_Focused": "聚焦型激光手枪",
    "LaserRifle_Focused": "聚焦型激光步枪",
    "PlasmaPistol_Focused": "聚焦型等离子手枪",
    "PlasmaRifle_Focused": "聚焦型等离子步枪",
    "GatlingLaser": "加特林激光枪",
    "GaussRifle": "高斯步枪",
    "Fatman_Guided": "制导型胖子",
    "MissilLauncher_Guided": "制导型导弹发射器",
    "PipePistol_HairTrigger": "轻扳机管状手枪",
    "032Pistol_Hardened": "装甲强化型 .32 手枪",
    "Pistol_Hardened": "装甲强化型 10mm 手枪",
    "AssaultRifle_Hardened": "装甲强化型突击步枪",
    "BBGun_Hardened": "装甲强化型BB 枪",
    "CombatShotgun_Hardened": "装甲强化型战斗霰弹枪",
    "Fatman_Hardened": "装甲强化型胖子",
    "Flamer_Hardened": "装甲强化型喷火器",
    "GaussRifle_Hardened": "装甲强化型高斯步枪",
    "HuntingRifle_Hardened": "装甲强化型狩猎步枪",
    "Rifle_Hardened": "装甲强化型杠杆步枪",
    "Minigun_Hardened": "装甲强化型迷你枪",
    "MissilLauncher_Hardened": "装甲强化型导弹发射器",
    "Railgun_Hardened": "装甲强化型轨道步枪",
    "SawedOffShotgun_Hardened": "装甲强化型锯短霰弹枪",
    "Magnum_Hardened": "装甲强化型狙击.44 手枪",
    "Shotgun_Hardened": "装甲强化型霰弹枪",
    "SniperRifle_Hardened": "装甲强化型狙击步枪",
    "PipePistol_Heavy": "重型管状手枪",
    "LeverActionRifle_Henrietta": "亨丽埃塔",
    "HuntingRifle": "狩猎步枪",
    "InstitutePistol_Improved": "改良型学院手枪",
    "InstitutePistol_Incendiary": "燃烧型学院手枪",
    "AssaultRifle_Infiltrator": "潜行者突击步枪",
    "InstitutePistol": "学院手枪",
    "InstituteRifle": "学院步枪",
    "JunkJet": "垃圾喷射机",
    "Melee_KitchenKnife": "厨房刀",
    "SawedOffShotgun_Kneecapper": "断膝者霰弹枪",
    "LaserMusket": "激光火枪",
    "LaserPistol": "激光手枪",
    "LaserRifle": "激光步枪",
    "Minigun_LeadBelcher": "呛铅迷你枪",
    "Rifle": "杠杆步枪",
    "Rifle_LincolnsRepeater": "林肯连发枪",
    "PipePistol_LittleBrother": "小弟管状手枪",
    "Pistol_LoneWanderer": "孤行者手枪",
    "InstituteRifle_Long": "长型学院步枪",
    "PipeRifle_Long": "长管状步枪",
    "GaussRifle_Magnetro4000": "磁子4000高斯步枪",
    "PlasmaRifle_MeanGreenMonster": "绿魔等离子步枪",
    "Minigun": "迷你枪",
    "Fatman_Mirv": "多弹头胖子",
    "MissilLauncher_MissLauncher": "导弹发射者",
    "MissilLauncher": "导弹发射器",
    "PlasmaPistol_MPLXNovasurge": "MPLX 新星浪潮",
    "InstituteRifle_NightVision": "夜视学院步枪",
    "PipeRifle_NightVision": "夜视管状步枪",
    "HuntingRifle_OlPainless": "老无痛",
    "PlasmaThrower_Overcharged": "过载型等离子抛射器",
    "Melee_Pickaxe": "鹤嘴锄",
    "PipePistol": "管状手枪",
    "PipeRifle": "管状步枪",
    "PlasmaPistol": "等离子手枪",
    "PlasmaRifle": "等离子步枪",
    "PlasmaThrower": "等离子抛射器",
    "PoliceBaton": "警棍",
    "Melee_PoolCue": "台球杆",
    "Flamer_Pressurized": "高压喷火器",
    "Railgun_Railmaster": "轨道大师步枪",
    "Railgun": "轨道步枪",
    "JunkJet_RecoilCompensated": "后坐力补偿垃圾喷射机",
    "BBGun_RedRocket": "红火箭 BB 枪",
    "Melee_RaiderSword": "无情掠夺者之剑",
    "032Pistol_Rusty": "生锈的 .32 手枪",
    "Pistol_Rusty": "生锈的 10mm 手枪",
    "AlienBlaster_Rusty": "生锈的外星冲击枪",
    "AssaultRifle_Rusty": "生锈的突击步枪",
    "BBGun_Rusty": "生锈的BB 枪",
    "CombatShotgun_Rusty": "生锈的战斗霰弹枪",
    "Fatman_Rusty": "生锈的胖子",
    "Flamer_Rusty": "生锈的喷火器",
    "GatlingLaser_Rusty": "生锈的加特林激光枪",
    "GaussRifle_Rusty": "生锈的高斯步枪",
    "HuntingRifle_Rusty": "生锈的狩猎步枪",
    "LaserPistol_Rusty": "生锈的激光手枪",
    "LaserRifle_Rusty": "生锈的激光步枪",
    "Rifle_Rusty": "生锈的杠杆步枪",
    "Minigun_Rusty": "生锈的迷你枪",
    "MissilLauncher_Rusty": "生锈的导弹发射器",
    "PlasmaPistol_Rusty": "生锈的等离子手枪",
    "PlasmaRifle_Rusty": "生锈的等离子步枪",
    "Railgun_Rusty": "生锈的轨道步枪",
    "SawedOffShotgun_Rusty": "生锈的锯短霰弹枪",
    "Magnum_Rusty": "生锈的狙击.44 手枪",
    "Shotgun_Rusty": "生锈的霰弹枪",
    "SniperRifle_Rusty": "生锈的狙击步枪",
    "SawedOffShotgun": "锯短霰弹枪",
    "InstitutePistol_Scattered": "散射型学院手枪",
    "Magnum": "狙击.44 手枪",
    "InstitutePistol_Scoped": "瞄准型学院手枪",
    "PipePistol_Scoped": "瞄准型管状手枪",
    "Shotgun": "霰弹枪",
    "LaserPistol_SmugglersEnd": "走私者终结",
    "BumperSword": "狙击步枪",
    "SniperRifle": "狙击步枪",
    "JunkJet_Tactical": "战术型垃圾喷射机",
    "PlasmaThrower_Tactical": "战术型等离子抛射器",
    "InstituteRifle_Targeting": "瞄准型学院步枪",
    "JunkJet_TechniciansRevenge": "技师的复仇",
    "AlienBlaster_Tuned": "调校型外星冲击枪",
    "GatlingLaser_Tuned": "调校型加特林激光枪",
    "LaserPistol_Tuned": "调校型激光手枪",
    "LaserRifle_Tuned": "调校型激光步枪",
    "PlasmaPistol_Tuned": "调校型等离子手枪",
    "PlasmaRifle_Tuned": "调校型等离子步枪",
    "GatlingLaser_Vengeance": "复仇型加特林激光枪",
    "SniperRifle_VictoryRifle": "胜利步枪",
    "InstituteRifle_VirgilsRifle": "维吉尔之步枪",
    "LaserRifle_WaserWifle": "瓦瑟尔步枪",
    "032Pistol_WildBillsSidearm": "狂野比尔的副手枪"
  };

  $scope.dwelleroutfitslist = {
    "AbrahamSpecial": "亚伯拉罕的休闲装",
    "AlistairSpecial": "坦佩尼的西装",
    "AllNightware": "睡衣",
    "AllNightware_Lucky": "幸运睡衣",
    "AllNightware_Naughty": "调皮睡衣",
    " AmataSpecial": "阿玛塔的连体服",
    "ArgyleSweater": "会计装",
    "BaseballUniform": "棒球服",
    "BattleArmor": "战斗装甲",
    "BattleArmor_Heavy": "重型战斗装甲",
    "BattleArmor_Sturdy": "坚固型战斗装甲",
    "BishopSpecial": "神职人员服装",
    "BittercupSpecial": "比特卡普的服装",
    "BOSUniform": "兄弟会制服",
    "BOSUniform_Advanced": "高级兄弟会制服",
    "BOSUniform_Expert": "专家级兄弟会制服",
    "BowlingShirt": "赛车手装",
    "BusinessDress": "挑拨者装",
    "BusinessSuit": "商务西装",
    "ButchSpecial": "地道蛇帮服",
    "CheckeredShirt": "春季便装",
    "ColonelSpecial": "奥图姆的制服",
    "CombatArmor": "战斗护甲",
    "CombatArmor_Heavy": "重型战斗护甲",
    "CombatArmor_Sturdy": "坚固型战斗护甲",
    "ComedianSpecial": "喜剧演员服",
    "costume_01": "休闲装01",
    "costume_02": "休闲装02",
    "costume_03": "休闲装03",
    "costume_04": "休闲装04",
    "costume_05": "休闲装05",
    "costume_06": "休闲装06",
    "costume_07": "休闲装07",
    "costume_08": "休闲装08",
    "costume_09": "休闲装09",
    "costume_10": "休闲装10",
    "CromwellSpecial": "忏悔者克伦威尔的破布",
    "Detective": "侦探装",
    "DooWopOutfit": "杜沃普歌手装",
    "DrLiSpecial": "李博士的服装",
    "ElderLyonsSpecial": "莱昂长老长袍",
    "EmpressSpecial": "共和国长袍",
    "EngineerSpecial": "工程师装",
    "EulogyJonesSpecial": "悼词琼斯的西装",
    "FarHarborSpecial": "破烂长外套",
    "FlightSuit": "飞行服",
    "FlightSuit_Advanced": "高级飞行服",
    "FlightSuit_Expert": "专家级飞行服",
    "FormalWear": "正装",
    "FormalWear_Fancy": "华丽正装",
    "FormalWear_Lucky": "幸运正装",
    "GreaserSpecial": "油渍帮服",
    "HandymanJumpsuit": "维修工连体服",
    "HandymanJumpsuit_Advanced": "高级连体服",
    "HandymanJumpsuit_Expert": "专家级连体服",
    "HarknessSpecial": "哈克尼斯的安保制服",
    "HazmatSuit": "废土防护服",
    "HazmatSuit_Heavy": "重型废土防护服",
    "HazmatSuit_Sturdy": "坚固型废土防护服",
    "Horseman_DeathJacket": "死亡之夹克",
    "Horseman_FamineVestment": "饥荒之袍",
    "Horseman_PestilencePlating": "瘟疫之甲",
    "Horseman_WarArmor": "战争之甲",
    "HunterGear_Bounty": "赏金猎人装备",
    "HunterGear_Mutant": "突变体猎人装备",
    "HunterGear_Treasure": "寻宝猎人装备",
    "InstituteJumper_Advanced": "高级学院连体服",
    "InstituteJumper_Expert": "专家级学院连体服",
    "JacketTshirt": "摩托车夹克",
    "JamesSpecial": "爸爸的实验服",
    "JerichoSpecial": "杰里科的皮甲",
    "JobinsonsJersey": "拉奇·乔宾逊的球衣",
    "jumpsuit": "避难所服",
    "KingSpecial": "中世纪君主服",
    "KnightSpecial": "骑士盔甲",
    "LabCoat": "实验服",
    "LabCoat_Advanced": "高级实验服",
    "LabCoat_Expert": "专家级实验服",
    "LibrarianSpecial": "图书管理员装",
    "LifeguardOutfit": "救生员服",
    "LoungeShirt": "保龄球衬衫",
    "LucasSpecial": "警长的马甲",
    "MayorSpecial": "市长服",
    "MechanicJumpsuit": "机械师连体服",
    "MetalArmor_Heavy": "重型金属盔甲",
    "MetalArmor_Sturdy": "坚固型金属盔甲",
    "MetalArmorRaiderBoss": "金属盔甲掠夺者首领",
    "MilitaryJumpsuit": "军用战斗服",
    "MilitaryJumpsuit_Commander": "指挥官战斗服",
    "MilitaryJumpsuit_Officer": "军官战斗服",
    "MoiraSpecial": "莫伊拉的RobCo连体服",
    "MoviefanSpecial": "电影迷装",
    "MrBurkeSpecial": "伯克先生",
    "NinjaSuit": "忍者装",
    "NormalClothing": "普通服装",
    "PiperSpecial": "派珀的服装",
    "PolkaDotDress": "波点连衣裙",
    "PowerArmor": "T-45a 动力装甲",
    "PowerArmor_51a": "T-51a 动力装甲",
    "PowerArmor_51d": "T-51d 动力装甲",
    "PowerArmor_51f": "T-51f 动力装甲",
    "PowerArmor_MkI": "X-01 Mk I 动力装甲",
    "PowerArmor_MkIV": "X-01 Mk IV 动力装甲",
    "PowerArmor_MkVI": "X-01 Mk VI 动力装甲",
    "PowerArmor_T45d": "T-45d 动力装甲",
    "PowerArmor_T45f": "T-45f 动力装甲",
    "PowerArmor_T60a": "T-60a 动力装甲",
    "PowerArmor_T60d": "T-60d 动力装甲",
    "PowerArmor_T60f": "T-60f 动力装甲",
    "PrestonSpecial": "民兵制服",
    "PrinceSpecial": "贵族服",
    "ProfessorSpecial": "教授装",
    "RadiationSuit": "防辐射服",
    "RadiationSuit_Advanced": "高级防辐射服",
    "RadiationSuit_Expert": "专家级防辐射服",
    "RaiderArmor": "掠夺者护甲",
    "RaiderArmor_Heavy": "重型掠夺者护甲",
    "RaiderArmor_Sturdy": "坚固型掠夺者护甲",
    "RiotGear": "雇佣兵装备",
    "RiotGear_Heavy": "重型雇佣兵装备",
    "RiotGear_Sturdy": "坚固型雇佣兵装备",
    "RothchildSpecial": "书记官罗斯柴尔德的长袍",
    "SantaSuit_Original": "原版圣诞老人服",
    "SarahSpecial": "莱昂的自豪之甲",
    "ScientistScrubs": "初级军官制服",
    "ScientistScrubs_Commander": "指挥官制服",
    "ScientistScrubs_Officer": "军官制服",
    "ScifiSpecial": "科幻迷装",
    "ScribeRobe": "书记长袍",
    "ScribeRobe_Elder": "长老长袍",
    "ScribeRobe_Initiate": "入门者长袍",
    "SequinDress": "避难所名流装",
    "SlasherSpecial": "恐怖迷装",
    "SodaFountainDress": "饮料吧裙装",
    "SoldierSpecial": "士兵制服",
    "SpecialThemeHalloween": "幽灵服",
    "SpecialThemeHalloween2": "骷髅服",
    "SpecialThemeThanksGiving": "清教徒装",
    "SpecialThemeXmas": "圣诞老人服",
    "SpecialThemeXmas2": "小精灵服",
    "SportsfanSpecial": "体育迷装",
    "StarPaladinSpecial": "十字骑士动力装甲",
    "SurgeonSpecial": "外科医生服",
    "SurvivorSpecial": "幸存者护甲",
    "Suspenders": "定制服装",
    "SweaterVest": "战前乡郊装",
    "Swimsuit": "泳装",
    "SwingDress": "摇摆连衣裙",
    "SynthArmor_Heavy": "重型合成护甲",
    "ThreedogSpecial": "三犬的服装",
    "TiedBlouse": "乡村少女装",
    "UtilityJumpsuit": "装甲避难所服",
    "UtilityJumpsuit_Heavy": "重型避难所服",
    "UtilityJumpsuit_Sturdy": "坚固型避难所服",
    "Vest": "战后情圣装",
    "WaitressUniform": "女服务员制服",
    "WandererArmor": "皮甲",
    "WandererArmor_Heavy": "重型皮甲",
    "WandererArmor_Sturdy": "坚固型皮甲",
    "WastelandSurgeon": "废土外科医生",
    "WastelandSurgeon_Doctor": "废土医生",
    "WastelandSurgeon_Settler": "废土医护",
    "WorkDress": "乡村女教师装",
    "WrestlerSpecial": "摔跤手装"
  };
});

function preset(preset, saveFileName) {

  /*
  if(isLoaded){
    if(window.location.href.indexOf("?") > -1){
      window.location.href = window.location.href.substring(0,window.location.href.indexOf("?")) +  "?preset=" + preset + "?savename=" + saveFileName;
    }else{
      window.location.href = window.location.href +  "?preset=" + preset + "?savename=" + saveFileName;

    }
    throw new Error("There already is a savefile loaded.")

  }  */ // Why does this matter?

  file = "presets/" + preset + ".json";

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = readPreset;
  xhr.open("GET", file, true);
  xhr.send();

  function readPreset() {
    if (xhr.readyState == 4) {
      var resp = JSON.parse(xhr.responseText);
      $('.instructions').hide();

      edit(saveFileName, resp);
    }
  };
}
