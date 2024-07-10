import '../architect.dart';
import 'component.dart';

class MinecraftFloor extends Component<MinecraftFloorStyle> {

  MinecraftFloor(super.style, super.dimension);

  @override
  void random() {
    // TODO: implement build
  }

  @override
  void build(MinecraftArchitect architect) {
    // TODO: implement build
  }
}

class MinecraftFloorStyle extends ComponentStyle {

  MinecraftFloorStyle(super.identifier, super.name);

  MinecraftFloorStyle.json(super.json) : super.json();
}