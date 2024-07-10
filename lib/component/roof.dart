import '../architect.dart';
import 'component.dart';

class MinecraftRoof extends Component<MinecraftRoofStyle> {

  MinecraftRoof(super.style, super.dimension);

  @override
  void random() {
    // TODO: implement build
  }

  @override
  void build(MinecraftArchitect architect) {
    // TODO: implement build
  }
}

class MinecraftRoofStyle extends ComponentStyle {

  MinecraftRoofStyle(super.identifier, super.name);

  MinecraftRoofStyle.json(super.json) : super.json();
}