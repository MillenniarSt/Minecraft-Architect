
import 'dart:io';

import 'package:beaver_builder_api/minecraft.dart';
import 'package:beaver_builder_api/style/style.dart';
import 'package:dart_minecraft/dart_nbt.dart';

import 'elements.dart';
import 'world.dart';

class MinecraftArchitect {

  int dataVersion = 3578;

  MinecraftEngineer engineer;
  MinecraftStyle style;

  final Map<Pos, MinecraftBlock> blocks = {};
  final List<MinecraftEntity> entities = [];

  MinecraftArchitect(this.engineer, this.style);

  void saveNbt(File file) {
    Dimension dimension = Dimension.findDimension(this.blocks.keys);
    List<MinecraftBlock> palette = [];
    Map<Pos, int> blocks = {};
    for(Pos pos in this.blocks.keys) {
      if(!palette.contains(this.blocks[pos])) {
        palette.add(this.blocks[pos]!);
      }
      blocks[pos - dimension.pos] = palette.indexOf(this.blocks[pos]!);
    }
    List<MinecraftEntity> entities = List.generate(this.entities.length, (index) => MinecraftEntity.nbt(this.entities[index].pos -= dimension.pos, this.entities[index].id, this.entities[index].properties));

    List<MapEntry<Pos, int>> blockEntries = List.from(blocks.entries);
    NbtCompound compoundTag = NbtCompound<NbtTag>(name: "", children: [
      NbtList<NbtInt>(name: "size", children:
      [NbtInt(name: "0", value: dimension.size.x.ceil()), NbtInt(name: "1", value: dimension.size.y.ceil()), NbtInt(name: "2", value: dimension.size.z.ceil())]
      ),
      NbtList<NbtCompound>(name: "entities", children: List.generate(entities.length, (index) => NbtCompound(name: index.toString(), children: [
        engineer.entityConfig.nbt(entities[index]),
        NbtList<NbtInt>(name: "blockPos", children:
        [NbtInt(name: "0", value: entities[index].pos.x.floor()), NbtInt(name: "1", value: entities[index].pos.y.floor()), NbtInt(name: "2", value: entities[index].pos.z.floor())]
        ),
        NbtList<NbtDouble>(name: "pos", children:
        [NbtDouble(name: "0", value: entities[index].pos.x), NbtDouble(name: "1", value: entities[index].pos.y), NbtDouble(name: "2", value: entities[index].pos.z)]
        ),
      ]))),
      NbtList<NbtCompound>(name: "blocks", children: List.generate(blockEntries.length, (index) => NbtCompound(name: index.toString(), children: [
        NbtList<NbtInt>(name: "pos", children:
        [NbtInt(name: "0", value: blockEntries[index].key.x.floor()), NbtInt(name: "1", value: blockEntries[index].key.y.floor()), NbtInt(name: "2", value: blockEntries[index].key.z.floor())]
        ),
        NbtInt(name: "state", value: blockEntries[index].value)
      ]))),
      NbtList<NbtCompound>(name: "palette", children: List.generate(palette.length, (index) => NbtCompound(name: index.toString(), children: [
        if(!palette[index].properties.isEmpty)
          NbtCompound<NbtString>(name: "Properties", children: [
            for(String key in palette[index].properties.entries.keys)
              NbtString(name: key, value: palette[index].properties.entries[key].toString())
          ]),
        NbtString(name: "Name", value: palette[index].id)
      ]))),
      NbtInt(name: "DataVersion", value: dataVersion)
    ]);

    NbtWriter(nbtCompression: NbtCompression.gzip).writeFile(file.path, compoundTag);
  }

  void placeBlock(Pos pos, MinecraftBlock block, {bool replace = true}) {
    if(!replace) {
      if(!blocks.containsKey(pos)) {
        blocks[pos] = block;
      }
    } else {
      blocks[pos] = block;
    }
  }

  void placeAllBlock(Map<Pos, MinecraftBlock> blocks, {bool replace = true}) {
    for(Pos pos in blocks.keys) {
      placeBlock(pos, blocks[pos]!, replace: replace);
    }
  }

  void addEntity(MinecraftEntity entity) {
    entities.add(entity);
  }

  void addAllEntity(List<MinecraftEntity> entities) {
    this.entities.addAll(entities);
  }
}