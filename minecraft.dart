import 'dart:convert';
import 'dart:io';

import 'component/floor.dart';
import 'component/roof.dart';
import 'config.dart';
import 'style/components_style.dart';
import 'style/model.dart';
import 'style/style.dart';

MinecraftEngineer minecraftEngineer = MinecraftEngineer("minecraft", "Minecraft");

class MinecraftEngineer {

  final String id;
  final String name;

  MinecraftEngineer(this.id, this.name);

  late final MinecraftRotationPropertiesConfig rotationConfig;
  late final MinecraftMaterialConfig materialConfig;
  late final MinecraftEntitiesConfig entityConfig;

  final Map<String, MinecraftStyle> styles = {};

  final Map<String, MinecraftWallStyle> wallStyles = {};
  final Map<String, MinecraftFloorStyle> floorStyles = {};
  final Map<String, MinecraftRoofStyle> roofStyles = {};
  final Map<String, MinecraftGadgetStyle> gadgetStyles = {};

  final Map<String, MinecraftStructure> structures = {};
  final Map<String, MinecraftModelPackage> models = {};

  Future<void> loadConfig(Directory config) async {
    rotationConfig = MinecraftRotationPropertiesConfig.json(jsonDecode(await File("${config.path}/rotation_properties.json").readAsString()));
    materialConfig = MinecraftMaterialConfig.json(jsonDecode(await File("${config.path}/materials.json").readAsString()));
    entityConfig = MinecraftEntitiesConfig.json(jsonDecode(await File("${config.path}/entity_properties.json").readAsString()));
  }

  Future<Map<String, dynamic>> loadPackage(Directory package) async {
    Map<String, dynamic> response = {
      "styles": {},
      "walls": {},
      "floors": {},
      "roofs": {},
      "gadgets": {}
    };

    if(await Directory("${package.path}/style").exists()) {
      await loadFiles(Directory("${package.path}/style"), "", (file, location) async => response["styles"][location] = MinecraftStyle.json(jsonDecode(await file.readAsString())));
    }

    if(await Directory("${package.path}/model").exists()) {
      await loadFiles(Directory("${package.path}/model"), "", (file, location) async => models[location] = MinecraftModelPackage.json(location, jsonDecode(await file.readAsString())));
    }
    if(await Directory("${package.path}/structure").exists()) {
      await loadFiles(Directory("${package.path}/structure"), "", (file, location) async => structures[location] = MinecraftStructure.json(jsonDecode(await file.readAsString())));
    }

    if(await Directory("${package.path}/wall").exists()) {
      await loadFiles(Directory("${package.path}/wall"), "", (file, location) async => response["walls"][location] = MinecraftWallStyle.json(jsonDecode(await file.readAsString())));
    }
    if(await Directory("${package.path}/floor").exists()) {
      await loadFiles(Directory("${package.path}/floor"), "", (file, location) async => response["floors"][location] = MinecraftFloorStyle.json(jsonDecode(await file.readAsString())));
    }
    if(await Directory("${package.path}/roof").exists()) {
      await loadFiles(Directory("${package.path}/roof"), "", (file, location) async => response["roofs"][location] = MinecraftRoofStyle.json(jsonDecode(await file.readAsString())));
    }
    if(await Directory("${package.path}/gadget").exists()) {
      await loadFiles(Directory("${package.path}/gadget"), "", (file, location) async => response["gadgets"][location] = MinecraftGadgetStyle.json(jsonDecode(await file.readAsString())));
    }

    return response;
  }

  Future<void> loadFiles(FileSystemEntity file, String location, Function(File file, String location) load) async {
    if(file is File) {
      try {
        await load.call(file, location);
      } catch(e) {
        //TODO
      }
    } else if(file is Directory) {
      for(FileSystemEntity subFile in file.listSync()) {
        await loadFiles(subFile, location + subFile.path.substring(file.path.length + (location.isEmpty ? 1 : 0), subFile is File ? subFile.path.lastIndexOf(".") : subFile.path.length), load);
      }
    }
  }
}