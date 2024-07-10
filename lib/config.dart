import 'package:dart_minecraft/dart_nbt.dart';

import 'elements.dart';
import 'style/model.dart';
import 'util.dart';

class MinecraftEntitiesConfig implements JsonReadable<Map<String, dynamic>> {

  final Map<String, MinecraftEntityConfig> entities = {};

  MinecraftEntitiesConfig();

  MinecraftEntitiesConfig.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    for(String id in json.keys) {
      entities[id] = MinecraftEntityConfig.json(json[id]!);
    }
    if(entities.containsKey("#")) {
      for(MinecraftEntityConfig entity in entities.values) {
        entity.defaultProperties.entries.addAll(entities["#"]!.defaultProperties.entries);
        entity.types.addAll(entities["#"]!.types);
      }
      entities.remove("#");
    }
  }

  void applyDefault(MinecraftEntity entity) {
    if(entities.containsKey(entity.id)) {
      entities[entity.id]!.applyDefault(entity.properties);
    }
  }

  NbtTag nbt(MinecraftEntity entity) => (entities[entity.id] ?? MinecraftEntityConfig.defaultEntity).convertNbt([], "nbt", entity.properties.entries)!;
}

class MinecraftEntityConfig implements JsonReadable<Map<String, dynamic>> {

  static final MinecraftEntityConfig defaultEntity = MinecraftEntityConfig(DefinedMinecraftProperties.empty(), {});

  late final DefinedMinecraftProperties defaultProperties;

  late final Map<String, dynamic> types;

  MinecraftEntityConfig(this.defaultProperties, this.types);

  MinecraftEntityConfig.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    defaultProperties = DefinedMinecraftProperties(_loadMap(json, (string) => string.contains("\$") ? string.split("\$")[1] : null));
    types = _loadMap(json, (string) => string.indexOf("\$") != 0 ? string.split("\$")[0] : null);
  }

  Map<String, dynamic> _loadMap(Map<String, dynamic> map, String? Function(String string) loadString) => {
    for(String key in map.keys)
      if(map[key] !is String || loadString(map[key]) != null)
        key: map[key] is String ? loadString.call(map[key]) : (map[key] is List ? _loadList(map[key], loadString) : _loadMap(map[key], loadString))
  };

  List _loadList(List list, String? Function(String string) loadString) => [
    for(final child in list)
      if(child !is String || loadString(child) != null)
        child is String ? loadString.call(child) : (child is List ? _loadList(child, loadString) : _loadMap(child, loadString))
  ];

  void applyDefault(DefinedMinecraftProperties properties) => properties += defaultProperties;

  NbtTag? convertNbt(List indexes, String name, dynamic data) {
    String? type = _getType(indexes);
    if(type != null) {
      switch(type) {
        case "bool" || "boolean": return NbtByte(name: name, value: data ? 1 : 0);
        case "byte": return NbtByte(name: name, value: data);
        case "short": return NbtShort(name: name, value: data);
        case "int" || "num" || "number": return NbtInt(name: name, value: data);
        case "long": return NbtLong(name: name, value: data);
        case "float": return NbtFloat(name: name, value: data);
        case "double": return NbtDouble(name: name, value: data);
        case "string" || "text": return NbtString(name: name, value: data);
        case "item": return NbtCompound<NbtTag>(name: name, children: [
          NbtString(name: "id", value: data is String ? data : data["id"]),
          NbtInt(name: "Count", value: data is String ? 1 : data["Count"]),
          if(data !is String && data["tag"] != null) convertNbt(indexes..add("tag"), "tag", data["tag"])!
        ]);
      }
    }
    if(data is bool) {
      return NbtByte(name: name, value: data ? 1 : 0);
    } else if(data is int) {
      return NbtInt(name: name, value: data);
    } else if(data is double) {
      return NbtFloat(name: name, value: data);
    } else if(data is String) {
      return NbtString(name: name, value: data);
    } else if(data is List) {
      return NbtList<NbtTag>(name: name, children: List.generate(data.length, (index) => convertNbt(indexes..add(index), index.toString(), data[index])!));
    } else if(data is Map<String, dynamic>) {
      return NbtCompound<NbtTag>(name: name, children: [for(String key in data.keys) convertNbt(indexes..add(key), key, data[key])!]);
    }
    return null;
  }

  String? _getType(List indexes) {
    dynamic types = this.types;
    for(final index in indexes) {
      types = types[index];
      if(types == null) {
        return null;
      }
    }
    return types is String ? types : null;
  }
}

class MinecraftMaterialConfig implements JsonReadable<List> {

  late final List<MinecraftMaterialConfigElement> elements;

  MinecraftMaterialConfig(this.elements);

  MinecraftMaterialConfig.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) => elements = List.generate(json.length, (index) => MinecraftMaterialConfigElement.json(json[index]));

  MinecraftBlock build(String type, String? shape) {
    for(MinecraftMaterialConfigElement element in elements) {
      if(element.type.contains(type)) {
        return element.build(type, shape);
      }
    }
    return MinecraftBlock(type, DefinedMinecraftProperties.empty());
  }
}

class MinecraftMaterialConfigElement implements JsonReadable<Map<String, dynamic>> {

  late final List<String> type;
  late final String defaultShape;
  final Map<String, List<String>> shape = {};

  MinecraftMaterialConfigElement(this.type, this.defaultShape);

  MinecraftMaterialConfigElement.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    type = List<String>.from(json["type"]);
    defaultShape = json["default"];
    for(String key in json["shape"].keys) {
      shape[key] = (json["shape"][key] as String).split("#");
    }
  }

  MinecraftBlock build(String type, String? shape) => MinecraftBlock(this.shape[shape ?? defaultShape]!.join(type), DefinedMinecraftProperties.empty());
}

class MinecraftRotationPropertiesConfig implements JsonReadable<List> {

  late final List<MinecraftRotationPropertyConfig> rotations;

  MinecraftRotationPropertiesConfig(this.rotations);

  MinecraftRotationPropertiesConfig.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) => rotations = List.generate(json.length, (index) => MinecraftRotationPropertyConfig.json(json[index]));

  MinecraftBlockProperties rotate(MinecraftBlockProperties properties, List<int> rotation) {
    MinecraftBlockProperties rotated = MinecraftBlockProperties();
    for(int i = 0; i < rotation.length; i++) {
      for(String property in properties.entries.keys) {
        properties.entries[property] = RandomList(List.generate(properties.entries[property]!.list.length, (index) => _rotateProperty(property, properties.entries[property]!.list[index], rotation[i], i)));
      }
    }
    return rotated;
  }

  dynamic _rotateProperty(String property, dynamic value, int rotation, int axis) {
    for(MinecraftRotationPropertyConfig propertyConfig in rotations) {
      dynamic rotated = propertyConfig.rotate(property, value, rotation, axis);
      if(rotated != null) {
        return rotated;
      }
    }
    return value;
  }
}

class MinecraftRotationPropertyConfig implements JsonReadable<Map<String, dynamic>> {

  late final List<Map<String, dynamic>> x;
  late final List<Map<String, dynamic>> y;
  late final List<Map<String, dynamic>> z;

  MinecraftRotationPropertyConfig(this.x, this.y, this.z);

  MinecraftRotationPropertyConfig.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    x = json["x"] != null ? List.generate(json["x"].length, (index) => json["x"][index]) : [];
    y = json["y"] != null ? List.generate(json["y"].length, (index) => json["y"][index]) : [];
    z = json["z"] != null ? List.generate(json["z"].length, (index) => json["z"][index]) : [];
  }

  List<Map<String, dynamic>>? axisOf(int axis) {
    switch(axis) {
      case 0: return x;
      case 1: return y;
      case 2: return z;
    }
    return null;
  }

  dynamic rotate(String property, dynamic value, int rotation, int axisIndex) {
    List<Map<String, dynamic>>? axis = axisOf(axisIndex);
    if(axis != null) {
      int? index = findIndex(axis, property, value);
      if(index != null) {
        return axis[(index + rotation) % axis.length][property];
      }
    }
    return value;
  }

  int? findIndex(List<Map<String, dynamic>> axis, String property, dynamic value) {
    for(int i = 0; i < axis.length; i++) {
      Map<String, dynamic> rotationConfig = axis[i];
      if(rotationConfig.containsKey(property) && rotationConfig[property] == value) {
        return i;
      }
    }
    return null;
  }
}