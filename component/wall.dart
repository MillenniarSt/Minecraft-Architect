import '../architect.dart';
import 'component.dart';

class MinecraftWall extends Component<MinecraftWallStyle> {

  MinecraftWall(super.style, super.dimension);

  @override
  void random() {
    // TODO: implement build
  }

  @override
  void build(MinecraftArchitect architect) {
    // TODO: implement build
  }
}

class MinecraftWallStyle extends ComponentStyle {

  MinecraftWallStyle(super.identifier, super.name);

  MinecraftWallStyle.json(super.json) : super.json();
}