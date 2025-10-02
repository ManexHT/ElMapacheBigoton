package ryuulogic.com.barber.cliente;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ryuulogic.com.barber.cita.Cita;

import java.net.URI;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/cliente")
public class ClienteController {
    @Autowired
    ClienteRepository clienteRepository;
    @GetMapping()
    public ResponseEntity<Iterable<Cliente>> findAll() {return ResponseEntity.ok(clienteRepository.findAll());}

    @GetMapping("/{id_cliente}")
    public ResponseEntity<Cliente> findById(@PathVariable Long id_cliente) {
        Optional<Cliente> indicadorResultadoOptional = clienteRepository.findById(id_cliente);
        if (indicadorResultadoOptional.isPresent()) {return ResponseEntity.ok(indicadorResultadoOptional.get());}
        else {return ResponseEntity.notFound().build();}
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody Cliente newCliente, UriComponentsBuilder ucb) {
        Cliente savedCliente = clienteRepository.save(newCliente);
        URI uri =ucb
                .path("Cliente/{id_cliente}")
                .buildAndExpand(savedCliente.getClass())
                .toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping("/{id_cliente}")
    public ResponseEntity<Void> update(@PathVariable Long id_cliente, @RequestBody Cliente clienteAct) {
        Cliente clienteAnt = clienteRepository.findById(id_cliente).get();
        if (clienteAnt != null) {
            clienteAct.setId_cliente(clienteAnt.getId_cliente());
            clienteRepository.save(clienteAct);
            return ResponseEntity.noContent().build();
        }
        else{return ResponseEntity.notFound().build();}
    }

    @DeleteMapping("/{id_cliente}")
    public ResponseEntity<Void> delete(@PathVariable Long id_cliente) {
        if (clienteRepository.findById(id_cliente).get() != null) {
            clienteRepository.deleteById(id_cliente);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
