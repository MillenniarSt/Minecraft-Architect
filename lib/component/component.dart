import '../architect.dart';
import '../util.dart';
import '../world.dart';

abstract class Component<S extends ComponentStyle> {

  S style;
  Dimension dimension;

  Component(this.style, this.dimension);

  void random();

  void build(MinecraftArchitect architect);
}

abstract class ComponentStyle implements JsonReadable<Map<String, dynamic>> {

  late final Identifier identifier;
  late final String name;

  ComponentStyle(this.identifier, this.name);

  ComponentStyle.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    identifier = Identifier.string(json["identifier"] as String);
    name = json["name"];
  }
}