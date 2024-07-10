import 'package:collection/collection.dart';

import 'world.dart';

class MinecraftBlock {

  String id = "";
  DefinedMinecraftProperties properties = DefinedMinecraftProperties.empty();

  MinecraftBlock(this.id, this.properties);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MinecraftBlock &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          properties == other.properties;

  @override
  int get hashCode => id.hashCode ^ properties.hashCode;
}

class MinecraftEntity {

  Pos pos;
  final DefinedMinecraftProperties properties;

  MinecraftEntity(this.pos, String id) : properties = DefinedMinecraftProperties({"id": id});

  MinecraftEntity.nbt(this.pos, String id, this.properties) {
    properties.entries["id"] = id;
  }

  double get rotationY => properties.entries["Rotation"] != null ? properties.entries["Rotation"][0] ?? 0 : 0;

  set rotationY(double value) => properties.entries["Rotation"] != null ? properties.entries["Rotation"][0] = value : properties.entries["Rotation"] = [value, 0.0];

  double get rotationX => properties.entries["Rotation"] != null ? properties.entries["Rotation"][1] ?? 0 : 0;

  set rotationX(double value) => properties.entries["Rotation"] != null ? properties.entries["Rotation"][1] = value : properties.entries["Rotation"] = [0.0, value];

  String get id => properties.entries["id"]!;
}

class DefinedMinecraftProperties {

  Map<String, dynamic> entries;

  DefinedMinecraftProperties(this.entries);

  DefinedMinecraftProperties.empty() : entries = {};

  bool get isEmpty => entries.isEmpty;

  DefinedMinecraftProperties operator +(DefinedMinecraftProperties other) => DefinedMinecraftProperties(entries..addAll(other.entries));

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DefinedMinecraftProperties &&
          runtimeType == other.runtimeType &&
          const DeepCollectionEquality().equals(entries, other.entries);

  @override
  int get hashCode => const DeepCollectionEquality().hash(entries);
}